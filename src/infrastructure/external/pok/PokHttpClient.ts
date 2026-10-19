import {
  IPokClient,
  PokEmitRequest,
  PokEmitResult,
  PokCredentialStatus,
  PokTemplateSummary,
} from '../../../domain/ports/IPokClient';
import { PokTemplateDetails } from '../../../domain/services/TemplateCompatibilityService';

export interface PokConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * HTTP adapter for POK Proof of Knowledge API.
 */
export class PokHttpClient implements IPokClient {
  constructor(private readonly config: PokConfig) {}

  async listTemplates(): Promise<PokTemplateSummary[]> {
    const json = await this.request<{
      data?: Array<{ id: string; name: string }>;
    }>('GET', '/template');
    return (json.data ?? []).map((t) => ({ id: t.id, name: t.name }));
  }

  async getTemplate(templateId: string): Promise<PokTemplateDetails | null> {
    try {
      const json = await this.request<Record<string, unknown>>(
        'GET',
        `/template/${encodeURIComponent(templateId)}`,
      );
      const customParams =
        (json.customParameters as Record<string, { label?: string; required?: boolean }>) ??
        (json.customization as { template?: { customParameters?: Record<string, { label?: string; required?: boolean }> } })
          ?.template?.customParameters ??
        {};

      const fields = Object.entries(customParams).map(([id, meta]) => ({
        id,
        label: meta?.label ?? id,
        required: meta?.required ?? false,
      }));

      return {
        id: String(json.id ?? templateId),
        name: String(json.name ?? ''),
        fields,
      };
    } catch (e: unknown) {
      if (this.isNotFound(e)) return null;
      throw e;
    }
  }

  async emitCredential(request: PokEmitRequest): Promise<PokEmitResult> {
    const body = {
      credential: {
        title: request.credential.title,
        emitter: request.credential.emitter,
        tags: request.credential.tags ?? [],
        emissionType: 'pok',
        skipAcceptance: false,
        dateFormat: 'dd/MM/yyyy',
        emissionDate: new Date().toISOString(),
      },
      receiver: {
        email: request.receiver.email,
        firstName: request.receiver.firstName,
        lastName: request.receiver.lastName,
        languageTag: 'es-CO',
      },
      customization: {
        template: {
          id: request.templateId,
          customParameters: request.customParameters ?? {},
        },
      },
      idempotencyKey: request.idempotencyKey,
    };

    try {
      const json = await this.request<{ id: string; state?: string }>(
        'POST',
        '/credential',
        body,
      );
      return {
        credentialId: json.id,
        state: json.state ?? 'pending',
      };
    } catch (e: unknown) {
      // DuplicateEmission: credential already created for idempotencyKey
      if (
        typeof e === 'object' &&
        e !== null &&
        'status' in e &&
        (e as { status: number }).status === 409 &&
        'body' in e
      ) {
        const parsed = JSON.parse(String((e as { body: string }).body)) as {
          certificateId?: string;
          id?: string;
        };
        return {
          credentialId: parsed.certificateId ?? parsed.id ?? 'duplicate',
          state: 'duplicate',
          duplicate: true,
        };
      }
      throw e;
    }
  }

  async getCredential(
    credentialId: string,
  ): Promise<PokCredentialStatus | null> {
    try {
      const json = await this.request<{
        id: string;
        state: string;
        title?: string;
      }>('GET', `/credential/${encodeURIComponent(credentialId)}`);
      return {
        id: json.id,
        state: json.state,
        title: json.title,
      };
    } catch (e: unknown) {
      if (this.isNotFound(e)) return null;
      throw e;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `ApiKey ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`POK ${res.status}: ${text}`) as Error & {
        status?: number;
        body?: string;
      };
      err.status = res.status;
      err.body = text;
      throw err;
    }

    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  }

  private isNotFound(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'status' in e &&
      (e as { status: number }).status === 404
    );
  }
}
