# Mailer Library

A modular email service library with support for multiple email providers.

## Features

- **Multiple Provider Support**: Currently supports Plunk, with easy extensibility for SendGrid and Resend
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Template Support**: Send emails using templates with variable substitution
- **Attachments**: Support for email attachments
- **Event Tracking**: Track user events (Plunk provider)
- **Environment Configuration**: Provider selection via environment variables
- **Error Handling**: Custom error types with detailed error information

## Configuration

Add the following environment variables to your `.env` file:

```env
# Mail Provider Selection
MAIL_PROVIDER=useplunk

# Plunk Configuration
MAIL_PLUNK_API_KEY=your-plunk-api-key-here

# Optional: Default sender information
MAIL_FROM_EMAIL=noreply@yourdomain.com
MAIL_FROM_NAME=Your App Name
```

Get your Plunk API key from: https://app.useplunk.com/settings/api-keys

## Usage

### Basic Email

```typescript
import { sendEmail } from '@/lib/mailer';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: '<h1>Welcome to our platform</h1><p>Thanks for signing up!</p>',
});
```

### Email with Template

```typescript
await sendEmail({
  to: 'user@example.com',
  template: 'welcome-email',
  variables: {
    firstName: 'John',
    activationLink: 'https://example.com/activate/abc123',
  },
});
```

### Email with Custom Sender

```typescript
await sendEmail({
  to: 'user@example.com',
  from: {
    email: 'hello@example.com',
    name: 'My App',
  },
  subject: 'Custom Sender Example',
  body: '<p>This email has a custom sender</p>',
});
```

### Email with Attachments

```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Invoice Attached',
  body: '<p>Please find your invoice attached</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

### Multiple Recipients

```typescript
await sendEmail({
  to: [
    'user1@example.com',
    { email: 'user2@example.com', name: 'User Two' },
  ],
  subject: 'Team Update',
  body: '<p>Important team announcement</p>',
});
```

### Using Mailer Instance

```typescript
import { getMailer } from '@/lib/mailer';

const mailer = getMailer();

const response = await mailer.send({
  to: 'user@example.com',
  subject: 'Test',
  body: '<p>Test email</p>',
});

console.log(response.messageId);
console.log(response.timestamp);
```

### Track Events (Plunk)

```typescript
import { getMailer } from '@/lib/mailer';
import { PlunkClient } from '@/lib/mailer/providers/useplunk';

const mailer = getMailer();
const plunkClient = mailer as any; // Type assertion needed for provider-specific methods

// Track user events
await plunkClient.trackEvent('user@example.com', 'signup', {
  source: 'landing-page',
  plan: 'pro',
});
```

### Error Handling

```typescript
import { sendEmail, MailerError } from '@/lib/mailer';

try {
  await sendEmail({
    to: 'user@example.com',
    subject: 'Test',
    body: '<p>Test</p>',
  });
} catch (error) {
  if (error instanceof MailerError) {
    console.error(`Mailer error (${error.provider}):`, error.message);
    console.error('Original error:', error.originalError);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## API Reference

### `sendEmail(options: EmailOptions): Promise<EmailResponse>`

Send an email using the default mailer instance.

#### EmailOptions

```typescript
interface EmailOptions {
  to: string | EmailRecipient | (string | EmailRecipient)[];
  subject: string;
  body: string;
  from?: string | EmailRecipient;
  replyTo?: string;
  template?: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
  subscribed?: boolean;
}
```

#### EmailResponse

```typescript
interface EmailResponse {
  success: boolean;
  messageId?: string;
  timestamp?: string;
  provider: EmailProvider;
  data?: unknown;
}
```

### `getMailer(provider?: EmailProvider, config?: MailerConfig): Mailer`

Get or create the mailer instance.

## Project Structure

```
src/lib/mailer/
├── index.ts                    # Main entry point
├── mailer.config.ts            # Configuration and types
└── providers/
    └── useplunk/
        ├── index.ts            # Plunk provider exports
        ├── client.ts           # Plunk client implementation
        └── types.ts            # Plunk-specific types
```

## Adding New Providers

To add a new email provider:

1. Create a new directory under `providers/`:
   ```
   providers/yourprovider/
   ├── index.ts
   ├── client.ts
   └── types.ts
   ```

2. Implement the provider client:
   ```typescript
   export class YourProviderClient {
     async send(options: EmailOptions): Promise<EmailResponse> {
       // Implementation
     }
   }
   ```

3. Update `mailer.config.ts`:
   ```typescript
   export type EmailProvider = "useplunk" | "yourprovider";
   ```

4. Update `index.ts` to initialize your provider:
   ```typescript
   case "yourprovider":
     return new YourProviderClient(config);
   ```
