import { PokTemplateDetails } from '../services/TemplateCompatibilityService';

export interface PokEmitRequest {
  templateId: string;
  receiver: {
    email: string;
    firstName: string;
    lastName: string;
  };
  credential: {
    title: string;
    emitter?: string;
    tags?: string[];
  };
  customParameters?: Record<string, string>;
  idempotencyKey: string;
}

export interface PokEmitResult {
  credentialId: string;
  state: string;
  duplicate?: boolean;
}

export interface PokCredentialStatus {
  id: string;
  state: string;
  title?: string;
}

export interface PokTemplateSummary {
  id: string;
  name: string;
}

export interface IPokClient {
  listTemplates(): Promise<PokTemplateSummary[]>;
  getTemplate(templateId: string): Promise<PokTemplateDetails | null>;
  emitCredential(request: PokEmitRequest): Promise<PokEmitResult>;
  getCredential(credentialId: string): Promise<PokCredentialStatus | null>;
}
