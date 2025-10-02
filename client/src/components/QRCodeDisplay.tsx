import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  value: string;
  title: string;
  size?: number;
}

export function QRCodeDisplay({ value, title, size = 128 }: QRCodeDisplayProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied",
      description: "Identifier copied to clipboard",
    });
  };

  const downloadQR = () => {
    // Create a canvas and draw the QR code to it for download
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = size;
      canvas.height = size;
      // In a real app, we'd render the QR code to canvas
      toast({
        title: "Download",
        description: "QR code download would begin",
      });
    }
  };

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <QRCode
            size={size}
            value={value}
            viewBox="0 0 256 256"
            className="border rounded"
            data-testid="qr-code"
          />
        </div>
        <div className="text-xs font-mono text-center text-muted-foreground">
          {value}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
            data-testid="button-copy-identifier"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQR}
            className="flex-1"
            data-testid="button-download-qr"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default QRCodeDisplay;
