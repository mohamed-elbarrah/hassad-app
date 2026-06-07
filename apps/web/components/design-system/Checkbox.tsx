import { cn } from "@/lib/utils";
import { Checkbox as BaseCheckbox } from "@/components/ui/checkbox";

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  id,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <BaseCheckbox
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "border-[1.5px] border-portal-card-border data-[state=checked]:bg-secondary-500 data-[state=checked]:border-secondary-500 data-[state=checked]:text-white",
        className,
      )}
    />
  );
}
