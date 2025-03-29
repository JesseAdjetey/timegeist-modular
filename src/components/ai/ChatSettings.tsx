
import React from 'react';
import { Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Button } from '@/components/ui/button';

interface ChatSettingsProps {
  onSizeChange: (size: 'small' | 'medium' | 'large') => void;
  size: 'small' | 'medium' | 'large';
  position: { x: number, y: number };
  onPositionReset: () => void;
  isDarkMode: boolean;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  onSizeChange,
  size,
  position,
  onPositionReset,
  isDarkMode,
}) => {
  const { backgroundColor, setBackgroundColor } = useSettingsStore();

  const predefinedColors = [
    { name: 'Purple', value: '#8664A0' },
    { name: 'Blue', value: '#4A6FA5' },
    { name: 'Green', value: '#4A8F6A' },
    { name: 'Red', value: '#A54A4A' },
    { name: 'Orange', value: '#D17A22' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
          <Settings size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 glass-card bg-opacity-90 backdrop-blur-lg border-white/10">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Chat Appearance</h3>

          {/* Chat size */}
          <div className="space-y-2">
            <Label className="text-xs">Chat Size</Label>
            <RadioGroup 
              value={size} 
              onValueChange={(value) => onSizeChange(value as 'small' | 'medium' | 'large')}
              className="flex justify-between"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small" className="text-xs">Small</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="text-xs">Medium</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large" className="text-xs">Large</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Chat accent color */}
          <div className="space-y-2">
            <Label className="text-xs">Accent Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  className={`w-full h-6 rounded-md transition-all ${
                    backgroundColor === color.value
                      ? 'ring-2 ring-white'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setBackgroundColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 p-0"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Position info */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Current Position</Label>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={onPositionReset}
              >
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Label className="text-xs w-2">X:</Label>
                <Input 
                  type="text" 
                  value={Math.round(position.x)} 
                  readOnly 
                  className="h-7 text-xs" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs w-2">Y:</Label>
                <Input 
                  type="text" 
                  value={Math.round(position.y)} 
                  readOnly 
                  className="h-7 text-xs" 
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChatSettings;
