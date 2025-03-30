
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ToastTest() {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Toast notification",
      description: "This is a test toast notification",
      variant: "default",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error notification",
      description: "This is an error toast notification",
      variant: "destructive",
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Toast Test Component</h2>
      <div className="flex gap-4">
        <Button onClick={showToast}>Show Toast</Button>
        <Button variant="destructive" onClick={showErrorToast}>Show Error Toast</Button>
      </div>
    </div>
  );
}
