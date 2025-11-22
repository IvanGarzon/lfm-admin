'use client';

import Input from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputFieldProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const PhoneInputField = ({
  name,
  label,
  value,
  onChange,
  defaultCountry = 'AU',
  placeholder = 'Enter phone number',
  disabled = false,
  className,
}: PhoneInputFieldProps) => {
  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        country={(defaultCountry as any) || 'AU'}
        international={false}
        value={value}
        onChange={(val) => onChange(val || '')}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
    </div>
  );
};
PhoneInputField.displayName = 'PhoneInputField';

export { PhoneInputField };
