"use client";

/**
 * Design System Form Select primitives — thin alias layer over the shadcn
 * Select components so existing call sites keep their `FormSelect*` API.
 */
export {
  Select as FormSelect,
  SelectGroup as FormSelectGroup,
  SelectValue as FormSelectValue,
  SelectTrigger as FormSelectTrigger,
  SelectContent as FormSelectContent,
  SelectLabel as FormSelectLabel,
  SelectItem as FormSelectItem,
  SelectSeparator as FormSelectSeparator,
  SelectScrollUpButton as FormSelectScrollUpButton,
  SelectScrollDownButton as FormSelectScrollDownButton,
} from "@/components/ui/select";
