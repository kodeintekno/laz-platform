import React from "react";
import ReactDatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import { id } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

// Register Indonesian locale
registerLocale("id", id);
setDefaultLocale("id");

export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
  name?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  error = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
  id,
  name,
}) => {
  const baseStyle =
    "block w-full rounded-xl border border-border/40 py-2.5 pl-10 pr-4 text-primary bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";

  const stateStyle = error
    ? "shadow-sm focus:border-destructive focus:ring-destructive/30"
    : "shadow-sm focus:border-primary focus:ring-primary/30";

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Calendar className={`w-5 h-5 ${error ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className="w-full relative">
        <ReactDatePicker
          id={id}
          name={name}
          selected={value}
          onChange={onChange}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="dd/MM/yyyy"
          className={`${baseStyle} ${stateStyle} w-full shadow-sm`}
          wrapperClassName="w-full"
          showPopperArrow={false}
          popperPlacement="bottom-start"
          popperClassName="!z-[9999]"
          portalId="date-picker-portal"
        />
      </div>
    </div>
  );
};

export default DatePicker;
