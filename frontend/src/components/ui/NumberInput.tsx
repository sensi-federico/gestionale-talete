import React from 'react';

interface NumberInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  allowEmpty?: boolean;
}

/**
 * NumberInput - Input numerico con bottoni +/- per migliore UX su mobile
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  unit,
  disabled = false,
  id,
  name,
  allowEmpty = true,
}: NumberInputProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = numValue - step;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = numValue + step;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty value if permitted
    if (inputValue === '' && allowEmpty) {
      onChange('');
      return;
    }

    // Parse as number
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      // Apply min/max constraints
      let constrained = parsed;
      if (min !== undefined && constrained < min) constrained = min;
      if (max !== undefined && constrained > max) constrained = max;
      onChange(constrained);
    }
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid number if not allowing empty
    if (!allowEmpty && (value === '' || value === undefined)) {
      onChange(min ?? 0);
    }
  };

  return (
    <div className={`number-input-wrapper ${unit ? 'has-unit' : ''}`}>
      <button
        type="button"
        className="number-input-btn number-input-btn--minus"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && numValue <= min)}
        aria-label="Diminuisci"
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="number-input-field"
      />
      {unit && <span className="number-input-unit">{unit}</span>}
      <button
        type="button"
        className="number-input-btn number-input-btn--plus"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && numValue >= max)}
        aria-label="Aumenta"
      >
        +
      </button>
    </div>
  );
}

export default NumberInput;
