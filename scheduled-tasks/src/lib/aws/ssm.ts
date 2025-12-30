import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Tracer } from '@duke-hq/libtracing';

const tracer = new Tracer('services/scheduled-tasks/src/lib/aws/ssm');

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION,
});

// In-memory cache for parameters during Lambda execution
const parameterCache = new Map<string, string>();

/**
 * Retrieves a secure parameter from AWS Systems Manager Parameter Store
 * Uses SecureString parameter type with KMS encryption
 * Implements caching to avoid repeated API calls during Lambda execution
 */
export async function getSecureParameter(parameterName: string): Promise<string> {
  return await tracer.span('getSecureParameter', async (span) => {
    span.setAttributes({
      'ssm.parameter.name': parameterName,
      'ssm.parameter.cached': parameterCache.has(parameterName),
    });

    // Return cached value if available
    const existing = parameterCache.get(parameterName);
    if (existing != null) {
      return existing;
    }

    try {
      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true, // Required for SecureString parameters
      });

      const response = await ssmClient.send(command);

      if (response.Parameter?.Value == null) {
        throw new Error(`Parameter ${parameterName} not found or has no value`);
      }

      const value = response.Parameter.Value;

      // Cache the parameter value for the duration of this Lambda execution
      parameterCache.set(parameterName, value);

      span.setAttributes({
        'ssm.parameter.type': response.Parameter.Type,
        'ssm.parameter.retrieved': true,
      });

      return value;
    } catch (error) {
      span.error(error);
      throw new Error(
        `Failed to retrieve secure parameter ${parameterName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
}
