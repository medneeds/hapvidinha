import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

interface ExamCurvesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCurves: (curves: string[]) => void;
  patientName?: string;
}

interface ExamTemplate {
  id: string;
  name: string;
  abbreviation: string;
}

const EXAM_TEMPLATES: ExamTemplate[] = [
  { id: 'sodio', name: 'SÓDIO', abbreviation: 'Na' },
  { id: 'potassio', name: 'POTÁSSIO', abbreviation: 'K' },
  { id: 'troponina', name: 'TROPONINA', abbreviation: 'TROP' },
  { id: 'cpk', name: 'CPK', abbreviation: 'CPK' },
  { id: 'leucocitos', name: 'LEUCÓCITOS', abbreviation: 'LEUCO' },
  { id: 'creatinina', name: 'CREATININA', abbreviation: 'Cr' },
  { id: 'ureia', name: 'UREIA', abbreviation: 'Ur' },
  { id: 'hemoglobina', name: 'HEMOGLOBINA', abbreviation: 'Hb' },
  { id: 'plaquetas', name: 'PLAQUETAS', abbreviation: 'Plaq' },
  { id: 'pcr', name: 'PCR', abbreviation: 'PCR' },
  { id: 'lactato', name: 'LACTATO', abbreviation: 'Lac' },
];

interface ExamValues {
  [examId: string]: string[];
}

export function ExamCurvesDialog({
  open,
  onOpenChange,
  onAddCurves,
  patientName,
}: ExamCurvesDialogProps) {
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [examValues, setExamValues] = useState<ExamValues>({});

  const handleToggleExam = (examId: string) => {
    setSelectedExams((prev) => {
      if (prev.includes(examId)) {
        // Remove exam and its values
        const newValues = { ...examValues };
        delete newValues[examId];
        setExamValues(newValues);
        return prev.filter((id) => id !== examId);
      } else {
        // Add exam with one empty value field
        setExamValues((prevValues) => ({
          ...prevValues,
          [examId]: [''],
        }));
        return [...prev, examId];
      }
    });
  };

  const handleAddValueField = (examId: string) => {
    setExamValues((prev) => ({
      ...prev,
      [examId]: [...(prev[examId] || []), ''],
    }));
  };

  const handleRemoveValueField = (examId: string, index: number) => {
    setExamValues((prev) => ({
      ...prev,
      [examId]: prev[examId].filter((_, i) => i !== index),
    }));
  };

  const handleValueChange = (examId: string, index: number, value: string) => {
    setExamValues((prev) => ({
      ...prev,
      [examId]: prev[examId].map((v, i) => (i === index ? value : v)),
    }));
  };

  const handleAdd = () => {
    const curves = selectedExams
      .map((examId) => {
        const exam = EXAM_TEMPLATES.find((e) => e.id === examId);
        const values = examValues[examId]?.filter((v) => v.trim() !== '') || [];
        
        if (exam && values.length > 0) {
          return `${exam.abbreviation}: ${values.join(' > ').toUpperCase()}`;
        }
        return null;
      })
      .filter((curve): curve is string => curve !== null);

    if (curves.length > 0) {
      onAddCurves(curves);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSelectedExams([]);
    setExamValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Adicionar Curva de Exames
            {patientName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {patientName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {EXAM_TEMPLATES.map((exam) => (
              <div key={exam.id} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={exam.id}
                    checked={selectedExams.includes(exam.id)}
                    onCheckedChange={() => handleToggleExam(exam.id)}
                  />
                  <Label
                    htmlFor={exam.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {exam.name} ({exam.abbreviation})
                  </Label>
                </div>

                {selectedExams.includes(exam.id) && (
                  <div className="ml-6 space-y-2">
                    {examValues[exam.id]?.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Valor (ex: 119, pendente)"
                          value={value}
                          onChange={(e) =>
                            handleValueChange(exam.id, index, e.target.value)
                          }
                          className="flex-1"
                        />
                        {examValues[exam.id].length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveValueField(exam.id, index)}
                            className="h-10 w-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddValueField(exam.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Valor
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedExams.length === 0}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Adicionar Curvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
