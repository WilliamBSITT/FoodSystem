const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/g;
const APOSTROPHE_VARIANTS_REGEX = /[\u2018\u2019\u02BC\u00B4\u0060]/g;
const PRODUCT_NAME_REGEX = /^[\p{L}\p{N}\s\-.,()'&:/!?;]+$/u;
const FLEXIBLE_NAME_REGEX = /^[\p{L}\p{N}\s\-.,()'&:/!?;]+$/u;

function sanitizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeApostrophes(input: string): string {
  return input.replace(APOSTROPHE_VARIANTS_REGEX, "'");
}

export function sanitizeInputOnChange(input: string): string {
  return normalizeApostrophes(input).replace(CONTROL_CHARACTERS_REGEX, " ");
}

export function sanitizeInput(input: string): string {
  return sanitizeWhitespace(normalizeApostrophes(input).replace(CONTROL_CHARACTERS_REGEX, " "));
}

function validateWithRules(
  value: string,
  options: {
    requiredMessage: string;
    tooLongMessage: string;
    invalidMessage: string;
    maxLength: number;
    pattern: RegExp;
  },
): string | null {
  const sanitized = sanitizeInput(value);

  if (!sanitized) {
    return options.requiredMessage;
  }

  if (sanitized.length > options.maxLength) {
    return options.tooLongMessage;
  }

  if (!options.pattern.test(sanitized)) {
    return options.invalidMessage;
  }

  return null;
}

export function validateProductName(name: string): string | null {
  return validateWithRules(name, {
    requiredMessage: "",
    tooLongMessage: "Product name must be ≤ 150 chars",
    invalidMessage: "Product name contains invalid characters",
    maxLength: 150,
    pattern: PRODUCT_NAME_REGEX,
  });
}

export function validateFamilyName(name: string): string | null {
  return validateWithRules(name, {
    requiredMessage: "Family name is required",
    tooLongMessage: "Family name must be ≤ 100 chars",
    invalidMessage: "Family name contains invalid characters",
    maxLength: 100,
    pattern: FLEXIBLE_NAME_REGEX,
  });
}

export function validateCategoryName(name: string): string | null {
  return validateWithRules(name, {
    requiredMessage: "Category name is required",
    tooLongMessage: "Category name must be ≤ 100 chars",
    invalidMessage: "Category name contains invalid characters",
    maxLength: 100,
    pattern: FLEXIBLE_NAME_REGEX,
  });
}

export function validateShoppingListItemName(name: string): string | null {
  return validateWithRules(name, {
    requiredMessage: "Shopping list item name is required",
    tooLongMessage: "Shopping list item name must be ≤ 255 chars",
    invalidMessage: "Shopping list item name contains invalid characters",
    maxLength: 255,
    pattern: FLEXIBLE_NAME_REGEX,
  });
}

export function validateNotes(notes: string): string | null {
  const sanitized = sanitizeInput(notes);

  if (sanitized.length > 1000) {
    return "Notes must be ≤ 1000 chars";
  }

  return null;
}
