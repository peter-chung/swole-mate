"use client";

import React from "react";

type BaseProps = {
  label: string;
  id: string;
  containerClassName?: string;
  labelClassName?: string;
};

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & BaseProps;
type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  BaseProps;
type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & BaseProps;

const baseInputClasses =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100";

const baseLabelClasses =
  "block text-sm font-medium text-gray-700 dark:text-gray-200";

export function InputField({
  label,
  id,
  containerClassName,
  labelClassName,
  className,
  ...rest
}: InputFieldProps) {
  return (
    <div className={`space-y-2 ${containerClassName ?? ""}`}>
      <label htmlFor={id} className={`${baseLabelClasses} ${labelClassName ?? ""}`}>
        {label}
      </label>
      <input id={id} className={`${baseInputClasses} ${className ?? ""}`} {...rest} />
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  containerClassName,
  labelClassName,
  className,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  return (
    <div className={`space-y-2 ${containerClassName ?? ""}`}>
      <label htmlFor={id} className={`${baseLabelClasses} ${labelClassName ?? ""}`}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className={`${baseInputClasses} resize-y ${className ?? ""}`}
        {...rest}
      />
    </div>
  );
}

export function SelectField({
  label,
  id,
  containerClassName,
  labelClassName,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <div className={`space-y-2 ${containerClassName ?? ""}`}>
      <label htmlFor={id} className={`${baseLabelClasses} ${labelClassName ?? ""}`}>
        {label}
      </label>
      <select
        id={id}
        className={`${baseInputClasses} ${className ?? ""}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
