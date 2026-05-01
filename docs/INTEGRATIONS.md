# Integrations — Canvas Flow

---

## Cloudinary — Media Engine

Cloudinary is the **deterministic media engine** for all asset storage, transformation, and delivery.

### Configuration

```typescript
// environment variables
CLOUDINARY_CLOUD_NAME = your - cloud - name;
CLOUDINARY_API_KEY = your - api - key;
CLOUDINARY_API_SECRET = your - api - secret;
```

```typescript
// CloudinaryModule initialization
CloudinaryModule.forRoot({
  cloudName: configService.get('CLOUDINARY_CLOUD_NAME'),
  apiKey: configService.get('CLOUDINARY_API_KEY'),
  apiSecret: configService.get('CLOUDINARY_API_SECRET'),
});
```

### Secure Signed Uploads

All uploads go **directly from client to Cloudinary** — the backend never proxies binary data. The backend generates short-lived signed upload parameters:

```typescript
// Backend generates upload signature
const timestamp = Math.round(Date.now() / 1000);
const paramsToSign = {
  timestamp,
  folder: `orgs/${orgId}/assets`,
  upload_preset: 'canvas_flow_assets',
};
const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

return { signature, timestamp, apiKey, cloudName, folder };
```

```typescript
// Client uses signature to upload directly
const formData = new FormData();
formData.append('file', file);
formData.append('signature', signature);
formData.append('timestamp', timestamp);
formData.append('api_key', apiKey);
// POST to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
```

### Upload Presets

| Preset                  | Use Case                     | Transformations           |
| ----------------------- | ---------------------------- | ------------------------- |
| `canvas_flow_assets`    | General asset uploads        | Auto format, auto quality |
| `canvas_flow_avatars`   | User/org avatars             | 200×200 crop (face), WebP |
| `canvas_flow_thumbs`    | Project thumbnails           | 400×300 crop, WebP        |
| `canvas_flow_documents` | Document uploads (PDF/image) | No eager transform        |

### Transformation Pipeline

Cloudinary transformations are built as chained URL parameters:

```typescript
// Example: Resize + watermark + convert to WebP
cloudinary.url(publicId, {
  transformation: [
    { width: 1280, height: 720, crop: 'fill', gravity: 'auto' },
    {
      overlay: 'watermarks:canvas_flow_logo',
      gravity: 'south_east',
      opacity: 60,
    },
    { fetch_format: 'auto', quality: 'auto' },
  ],
});
```

**Supported transformation operations:**

| Category    | Operations                                                     |
| ----------- | -------------------------------------------------------------- |
| Resize      | `crop`, `fill`, `contain`, `cover`, `pad`, `scale`             |
| Crop        | `thumb`, `face`, `auto`, `custom` gravity                      |
| Rotate      | `angle: 90/180/270`, `auto_right`, `auto_left`                 |
| Flip        | `hflip`, `vflip`                                               |
| Color       | `brightness`, `contrast`, `saturation`, `hue`, `temperature`   |
| Effects     | `blur`, `sharpen`, `viesus_correct`, `improve`, `vibrance`     |
| Artistic    | `art:*`, `cartoonify`, `pixelate`, `sepia`, `grayscale`        |
| Overlays    | Text, image, video overlays with position, opacity, blend mode |
| Watermark   | Logo overlay with gravity and opacity control                  |
| Format      | `fetch_format: auto`, `f_webp`, `f_jpg`, `f_png`, `f_pdf`      |
| Quality     | `quality: auto`, `q_80`, `q_lossless`                          |
| Compression | `fl_progressive`, `fl_lossy`                                   |

### AI-Powered Cloudinary Features

| Feature            | Usage                               |
| ------------------ | ----------------------------------- |
| Background Removal | `e_background_removal`              |
| Auto Tagging       | Upload param: `auto_tagging: 0.6`   |
| Content Moderation | Upload param: `moderation: aws_rek` |
| OCR                | Upload param: `ocr: adv_ocr`        |
| Facial Detection   | `gravity: face`, `g_faces`          |
| Auto Enhancement   | `e_improve`, `e_viesus_correct`     |
| Object Detection   | `g_auto:subject`                    |
| Generative Fill    | `e_gen_fill:prompt_<text>`          |
| Generative Remove  | `e_gen_remove:prompt_<text>`        |
| Upscale            | `e_upscale`                         |
| Restore            | `e_restore`                         |

### Video Operations

| Operation            | Description                        |
| -------------------- | ---------------------------------- |
| Thumbnail extraction | `so_2.0` (seek offset)             |
| Video trimming       | `so_0,eo_10` (start/end offset)    |
| Video resizing       | Same crop/resize params as images  |
| Format conversion    | `f_mp4`, `f_webm`, `f_gif`         |
| Compression          | `vc_auto`, `q_auto`                |
| Overlay              | Image/text overlay on video frames |

### PDF & Document Operations

- Convert image to PDF: `f_pdf`
- Merge images into multi-page PDF: Cloudinary PDF batch
- Extract page from PDF: `pg_1` (page param)
- Render PDF page as image: upload + `f_jpg,pg_1`

### Webhook Events

Cloudinary posts to `POST /webhooks/cloudinary`:

| Event                    | Trigger                         |
| ------------------------ | ------------------------------- |
| `upload`                 | Asset successfully uploaded     |
| `eager`                  | Eager transformation complete   |
| `moderation`             | Content moderation result ready |
| `auto_tagging_completed` | Auto-tagging finished           |
| `ocr_completed`          | OCR extraction finished         |
| `background_removal`     | Background removal complete     |
| `resource_deleted`       | Asset deleted                   |

Signature verification:

```typescript
const expectedSignature = crypto
  .createHash('sha1')
  .update(body + apiSecret)
  .digest('hex');
// Compare with X-Cld-Signature header
```

### Responsive Image Delivery

```typescript
// Generate srcset for responsive images
const srcset = [320, 640, 1024, 1280, 1920]
  .map(
    (w) =>
      `${cloudinary.url(publicId, { width: w, crop: 'scale', fetch_format: 'auto' })} ${w}w`,
  )
  .join(', ');
```

---

## Leonardo AI — Generative Engine

Leonardo AI is the **generative media engine** for all AI-assisted creative workflows.

### Configuration

```typescript
LEONARDO_API_KEY = your - leonardo - api - key;
```

```typescript
// Base API
const LEONARDO_BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';
const headers = { Authorization: `Bearer ${apiKey}` };
```

### Text-to-Image Generation

```typescript
// POST /generations
{
  prompt: "A serene mountain lake at sunrise, photorealistic",
  negative_prompt: "blurry, low quality, watermark",
  modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",  // Leonardo Diffusion XL
  width: 1024,
  height: 1024,
  num_images: 1,
  guidance_scale: 7,
  num_inference_steps: 30,
  scheduler: "EULER_DISCRETE",
  presetStyle: "CINEMATIC",
}
```

**Response:** `{ sdGenerationJob: { generationId: "..." } }` — async, poll for completion.

### Image-to-Image

```typescript
// POST /generations
{
  prompt: "...",
  init_image_id: "<uploaded-image-id>",  // must pre-upload to Leonardo
  init_strength: 0.5,  // 0 = full generation, 1 = fully preserve source
  // ...other generation params
}
```

### Inpainting

```typescript
// POST /generations
{
  prompt: "Replace with a sunset sky",
  init_image_id: "<image-id>",
  mask_image_id: "<mask-image-id>",   // white = areas to fill, black = preserve
  num_inference_steps: 50,
}
```

### Outpainting (Canvas Extension)

```typescript
// POST /canvas-textures or /generations with outpaint params
{
  prompt: "Extend the forest scene naturally",
  init_image_id: "<image-id>",
  expand_top: 256,
  expand_right: 256,
  expand_bottom: 0,
  expand_left: 0,
}
```

### Pre-Uploading Images to Leonardo

Before referencing images in generation requests, they must be uploaded to Leonardo:

```typescript
// Step 1: Get upload URL
// POST /init-image
{
  extension: 'jpg';
}
// Response: { url, fields, id }

// Step 2: PUT file to presigned S3 URL
await fetch(url, { method: 'PUT', body: imageFile, headers: fields });

// Step 3: Use `id` as `init_image_id` in generation request
```

### Polling for Generation Status

Leonardo jobs are async. Poll `GET /generations/{id}`:

```typescript
// Status values: PENDING | COMPLETE | FAILED
const result = await leonardoClient.getGeneration(generationId);
if (result.status === 'COMPLETE') {
  const imageUrls = result.generated_images.map((img) => img.url);
  // Download and upload to Cloudinary for permanent storage
}
```

Canvas Flow uses **webhook events** to avoid polling:

```
Leonardo → POST /webhooks/leonardo
Body: { type: 'image_generation.complete', generationId, imageUrls }
```

### Available Models

| Model                 | Best For                        |
| --------------------- | ------------------------------- |
| Leonardo Diffusion XL | General purpose, photorealistic |
| Leonardo Kino XL      | Cinematic, film-style           |
| Leonardo Vision XL    | Scenes and environments         |
| Leonardo Lightning XL | Fast generation (fewer steps)   |
| AlbedoBase XL         | Art and illustration            |
| DreamShaper v7        | Creative, painterly             |

### Style Presets

`CINEMATIC`, `CREATIVE`, `DYNAMIC`, `ENVIRONMENT`, `GENERAL`, `ILLUSTRATION`, `PHOTOGRAPHY`, `RAYTRACED`, `RENDER_3D`, `SKETCH_BW`, `SKETCH_COLOR`, `VIBRANT`, `NONE`

### Credit Cost Mapping

Each generation call consumes Leonardo API tokens, which are mapped to Canvas Flow credits:

| Operation          | Approx API tokens | CF Credits |
| ------------------ | ----------------- | ---------- |
| 512×512 standard   | 4                 | 2          |
| 1024×1024 standard | 8                 | 5          |
| 1024×1024 HD       | 12                | 10         |
| Image-to-image     | 8                 | 5          |
| Inpainting         | 10                | 8          |
| Outpainting        | 12                | 10         |

Credits are deducted **before** job submission. Refund logic applies on `FAILED` jobs.

### Webhook Verification

```typescript
// Verify Leonardo webhook signature from header
const signature = req.headers['x-leonardo-signature'];
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');
```

---

## Twilio Verify — SMS OTP

Used for phone number verification and optional 2FA.

```typescript
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx;
TWILIO_AUTH_TOKEN = your - auth - token;
TWILIO_VERIFY_SID = VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx;
```

**Flow:**

1. `POST /sms-validation` → Twilio sends OTP to phone
2. `POST /sms-validation/confirm` → Backend calls Twilio `check` API

---

## AWS S3 — Backup Storage (Optional)

Used for long-term archive of exported files and raw upload backups.

```typescript
AWS_S3_BUCKET = canvas - flow - assets;
AWS_REGION = us - east - 1;
AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE;
AWS_SECRET_ACCESS_KEY = your - secret;
```

S3 is **not** the primary delivery path — Cloudinary CDN handles all delivery. S3 is backup/archive only.

---

## Sentry — Error Tracking

```typescript
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

Initialized in `instrument.ts` before app bootstrap. Captures:

- Unhandled exceptions
- Slow HTTP transactions (performance tracing)
- BullMQ job failures

---

## Future Provider Integrations

The provider interface pattern (see [ARCHITECTURE.md](ARCHITECTURE.md)) allows adding:

| Provider           | Capability                      |
| ------------------ | ------------------------------- |
| OpenAI DALL-E 3    | Text-to-image alternative       |
| Stability AI       | Image generation, upscale       |
| Replicate          | Custom ML model inference       |
| Remove.bg          | Dedicated background removal    |
| Adobe Firefly      | Creative generation             |
| Custom ML Pipeline | Self-hosted inference endpoints |

New providers implement `GenerativeAIProvider` and are registered via the dependency injection token `GENERATIVE_AI_PROVIDER`.
