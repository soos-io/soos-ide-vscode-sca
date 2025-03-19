import { isNil, StringUtilities } from "@soos-io/api-client/dist/utilities";

const ensureNonEmptyValue = (value: string | null | undefined, propertyName: string): string => {
  if (isNil(value) || StringUtilities.isEmptyString(value))
    throw new Error(`'${propertyName}' is required.`);
  return value;
};

export { ensureNonEmptyValue };
