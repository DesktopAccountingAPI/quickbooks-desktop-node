// Harness for README fragments (scripts/readme-samples.mjs): each fragment becomes the body of
// {{NAME}}, with these names in scope.
import { DesktopAccountingApi } from "@desktopaccountingapi/quickbooks-desktop";

declare const client: DesktopAccountingApi;
declare function save(value: unknown): void;
declare function showToEndUser(message: string): void;

export async function {{NAME}}(): Promise<void> {
  {{SAMPLE}}
}
