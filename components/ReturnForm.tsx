'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createReturnForm } from '@/lib/firestore';
import { PunchLog, ReturnForm as ReturnFormType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const returnItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  condition: z.enum(['good', 'damaged', 'missing']),
  notes: z.string().optional(),
});

const returnFormSchema = z.object({
  items: z.array(returnItemSchema).min(1, 'At least one item is required'),
});

type FormData = z.infer<typeof returnFormSchema>;

interface ReturnFormProps {
  punchLog: PunchLog;
  onFormSubmitted: () => void;
}

export default function ReturnForm({ punchLog, onFormSubmitted }: ReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<ReturnFormType | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { control, register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      items: [{ itemName: '', quantity: 1, condition: 'good', notes: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Return Form - ${punchLog.driverName} - ${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const generatePDF = (formData: ReturnFormType) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('RETURN FORM', 105, 20, { align: 'center' });
    
    // Driver Info
    doc.setFontSize(12);
    doc.text(`Driver: ${formData.driverName}`, 20, 40);
    doc.text(`Driver ID: ${formData.driverId}`, 20, 50);
    doc.text(`Date: ${format(formData.submittedAt, 'MMM dd, yyyy hh:mm a')}`, 20, 60);
    doc.text(`Punch In Time: ${format(punchLog.timestamp, 'MMM dd, yyyy hh:mm a')}`, 20, 70);
    
    // Items table
    let yPos = 90;
    doc.setFontSize(14);
    doc.text('Return Items:', 20, yPos);
    yPos += 10;
    
    // Table headers
    doc.setFontSize(10);
    doc.text('Item Name', 20, yPos);
    doc.text('Qty', 100, yPos);
    doc.text('Condition', 120, yPos);
    doc.text('Notes', 160, yPos);
    yPos += 10;
    
    // Table rows
    formData.items.forEach((item) => {
      doc.text(item.itemName, 20, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(item.condition, 120, yPos);
      doc.text(item.notes || '-', 160, yPos);
      yPos += 8;
    });
    
    // Summary
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Total Items: ${formData.totalItems}`, 20, yPos);
    
    // Download
    doc.save(`return-form-${formData.driverName}-${format(formData.submittedAt, 'yyyy-MM-dd')}.pdf`);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const returnForm: Omit<ReturnFormType, 'id'> = {
        driverId: punchLog.driverId,
        driverName: punchLog.driverName,
        punchLogId: punchLog.id,
        items: data.items,
        totalItems: data.items.reduce((sum, item) => sum + item.quantity, 0),
        submittedAt: new Date(),
        status: 'pending',
      };

      const newForm = await createReturnForm(returnForm);
      setSubmittedForm(newForm);
      onFormSubmitted();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submittedForm) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="text-green-600 mb-2">
              <FileText className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Form Submitted Successfully!
            </h3>
            <p className="text-green-700 mb-4">
              Your return form has been submitted and is pending approval.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print Form
              </Button>
              <Button 
                onClick={() => generatePDF(submittedForm)}
                variant="outline"
                size="sm"
              >
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hidden printable version */}
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">RETURN FORM</h1>
              <div className="mt-4 space-y-1">
                <p><strong>Driver:</strong> {submittedForm.driverName}</p>
                <p><strong>Driver ID:</strong> {submittedForm.driverId}</p>
                <p><strong>Date:</strong> {format(submittedForm.submittedAt, 'MMM dd, yyyy hh:mm a')}</p>
                <p><strong>Punch In Time:</strong> {format(punchLog.timestamp, 'MMM dd, yyyy hh:mm a')}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Item Name</th>
                  <th className="border border-gray-300 p-2 text-center">Quantity</th>
                  <th className="border border-gray-300 p-2 text-center">Condition</th>
                  <th className="border border-gray-300 p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {submittedForm.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{item.itemName}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-center capitalize">{item.condition}</td>
                    <td className="border border-gray-300 p-2">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right">
              <p className="text-lg"><strong>Total Items: {submittedForm.totalItems}</strong></p>
            </div>

            <div className="mt-8 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Form ID: {submittedForm.id} | Status: {submittedForm.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Return Items Form
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Punched in at {format(punchLog.timestamp, 'hh:mm a')} - Fill out items being returned
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Item #{index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      {...register(`items.${index}.itemName`)}
                      placeholder="Enter item name"
                    />
                    {errors.items?.[index]?.itemName && (
                      <p className="text-sm text-red-600">
                        {errors.items[index]?.itemName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-600">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={watchedItems[index]?.condition || 'good'}
                      onValueChange={(value) => {
                        // This is handled by react-hook-form
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      {...register(`items.${index}.condition`)}
                      value={watchedItems[index]?.condition || 'good'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      {...register(`items.${index}.notes`)}
                      placeholder="Additional notes about this item"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ itemName: '', quantity: 1, condition: 'good', notes: '' })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Item
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </Badge>
              </div>

              <Button type="submit" disabled={loading} size="lg">
                {loading ? 'Submitting...' : 'Submit Form'}
              </Button>
            </div>
          </div>

          {errors.items && (
            <p className="text-sm text-red-600">
              {errors.items.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}