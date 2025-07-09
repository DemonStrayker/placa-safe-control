import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { useAuth, Plate } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const PDFReport = () => {
  const { getPlatesByDate } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const reportDate = new Date(selectedDate);
      const plates = getPlatesByDate(reportDate);

      if (plates.length === 0) {
        toast.error('Nenhuma placa encontrada para a data selecionada');
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 8;
      let yPosition = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const title = 'Relatório de Placas - Portaria';
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
      
      yPosition += lineHeight * 2;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const dateText = `Data: ${reportDate.toLocaleDateString('pt-BR')}`;
      pdf.text(dateText, margin, yPosition);
      
      const generatedText = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      const generatedWidth = pdf.getTextWidth(generatedText);
      pdf.text(generatedText, pageWidth - margin - generatedWidth, yPosition);
      
      yPosition += lineHeight * 2;

      // Summary
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total de placas: ${plates.length}`, margin, yPosition);
      yPosition += lineHeight;

      const pending = plates.filter(p => !p.arrivalConfirmed).length;
      const arrived = plates.filter(p => p.arrivalConfirmed && !p.departureConfirmed).length;
      const departed = plates.filter(p => p.departureConfirmed).length;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`Pendentes: ${pending} | Presentes: ${arrived} | Saíram: ${departed}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Table headers
      pdf.setFont('helvetica', 'bold');
      pdf.text('Placa', margin, yPosition);
      pdf.text('Transportadora', margin + 40, yPosition);
      pdf.text('Registro', margin + 100, yPosition);
      pdf.text('Status', margin + 140, yPosition);
      
      yPosition += lineHeight;
      
      // Draw line under headers
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Table content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      plates.forEach((plate, index) => {
        if (yPosition > 270) { // New page if content is too long
          pdf.addPage();
          yPosition = margin;
        }

        const formatPlate = (plateNumber: string) => {
          if (plateNumber.length === 7 && !plateNumber.includes('-')) {
            return `${plateNumber.slice(0, 3)}-${plateNumber.slice(3)}`;
          }
          return plateNumber;
        };

        const getStatus = (plate: Plate) => {
          if (plate.departureConfirmed) return 'Saiu';
          if (plate.arrivalConfirmed) return 'Presente';
          return 'Pendente';
        };

        // Plate data
        pdf.text(formatPlate(plate.number), margin, yPosition);
        
        // Transportadora name (truncate if too long)
        const transportadoraName = plate.transportadoraName.length > 20 
          ? plate.transportadoraName.substring(0, 20) + '...'
          : plate.transportadoraName;
        pdf.text(transportadoraName, margin + 40, yPosition);
        
        // Registration time
        const regTime = plate.createdAt.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        pdf.text(regTime, margin + 100, yPosition);
        
        // Status
        pdf.text(getStatus(plate), margin + 140, yPosition);

        yPosition += lineHeight;

        // Add scheduled date and observations if available
        if (plate.scheduledDate || plate.observations) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          
          if (plate.scheduledDate) {
            const scheduledText = `Agendado: ${plate.scheduledDate.toLocaleString('pt-BR')}`;
            pdf.text(scheduledText, margin + 10, yPosition);
            yPosition += 5;
          }
          
          if (plate.observations) {
            const obsText = `Obs: ${plate.observations}`;
            pdf.text(obsText, margin + 10, yPosition);
            yPosition += 5;
          }
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        }

        // Add arrival/departure details
        if (plate.arrivalConfirmed || plate.departureConfirmed) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          
          if (plate.arrivalConfirmed) {
            const arrivalText = `Chegada: ${plate.arrivalConfirmed.toLocaleString('pt-BR')}`;
            pdf.text(arrivalText, margin + 10, yPosition);
            yPosition += 5;
          }
          
          if (plate.departureConfirmed) {
            const departureText = `Saída: ${plate.departureConfirmed.toLocaleString('pt-BR')}`;
            pdf.text(departureText, margin + 10, yPosition);
            yPosition += 5;
          }
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
        }

        yPosition += 3; // Space between entries
      });

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const footerText = `Página ${i} de ${pageCount} - Sistema de Controle de Placas`;
        const footerWidth = pdf.getTextWidth(footerText);
        pdf.text(footerText, (pageWidth - footerWidth) / 2, 285);
      }

      // Save the PDF
      const fileName = `relatorio_placas_${reportDate.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Relatório PDF
        </CardTitle>
        <CardDescription>
          Gere um relatório em PDF com as placas registradas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="report-date">Data do Relatório</Label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                id="report-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>O relatório incluirá:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Número da placa e transportadora</li>
            <li>Data e horário de registro</li>
            <li>Status (Pendente/Presente/Saiu)</li>
            <li>Observações (se houver)</li>
            <li>Data/horário de agendamento (se aplicável)</li>
            <li>Horários de chegada e saída confirmados</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFReport;