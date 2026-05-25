export type BackgroundRemovalResult = {
  blob: Blob;
  dataUrl: string;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const maxCanvasSide = 1536;

function getScaledSize(width: number, height: number) {
  const scale = Math.min(1, maxCanvasSide / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(source: Blob | string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let objectUrl: string | null = null;

    image.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      resolve(image);
    };
    image.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      reject(new Error('Image could not be loaded for cleanup.'));
    };

    if (typeof source === 'string') {
      image.src = source;
      return;
    }

    objectUrl = URL.createObjectURL(source);
    image.src = objectUrl;
  });
}

function getPixel(data: Uint8ClampedArray, index: number): Rgb {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
  };
}

function colorDistance(a: Rgb, b: Rgb) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function estimateBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Rgb {
  const samples: Rgb[] = [];
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 24));

  for (let x = 0; x < width; x += sampleStep) {
    samples.push(getPixel(data, x * 4));
    samples.push(getPixel(data, ((height - 1) * width + x) * 4));
  }

  for (let y = 0; y < height; y += sampleStep) {
    samples.push(getPixel(data, y * width * 4));
    samples.push(getPixel(data, (y * width + width - 1) * 4));
  }

  const total = samples.reduce(
    (sum, sample) => ({
      r: sum.r + sample.r,
      g: sum.g + sample.g,
      b: sum.b + sample.b,
    }),
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: total.r / samples.length,
    g: total.g / samples.length,
    b: total.b / samples.length,
  };
}

function isNearBackground(
  data: Uint8ClampedArray,
  index: number,
  background: Rgb,
  softThreshold: number
) {
  if (data[index + 3] < 10) {
    return true;
  }

  return colorDistance(getPixel(data, index), background) <= softThreshold;
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create transparent PNG.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

export async function removePlainImageBackground(
  source: Blob | string
): Promise<BackgroundRemovalResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Background cleanup is only available in the browser.');
  }

  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const { width, height } = getScaledSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height
  );

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Background cleanup is not available on this device.');
  }

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const background = estimateBackgroundColor(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const hardThreshold = 46;
  const softThreshold = 86;

  function enqueue(x: number, y: number) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixelIndex = y * width + x;

    if (visited[pixelIndex]) {
      return;
    }

    const dataIndex = pixelIndex * 4;

    if (!isNearBackground(data, dataIndex, background, softThreshold)) {
      return;
    }

    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const pixelIndex = queue[queueIndex];

    queueIndex += 1;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const dataIndex = pixelIndex * 4;
    const distance = colorDistance(getPixel(data, dataIndex), background);

    if (distance <= hardThreshold) {
      data[dataIndex + 3] = 0;
    } else {
      const alphaScale = Math.min(
        1,
        Math.max(0, (distance - hardThreshold) / (softThreshold - hardThreshold))
      );
      data[dataIndex + 3] = Math.round(data[dataIndex + 3] * alphaScale);
    }

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  context.putImageData(imageData, 0, 0);

  const blob = await canvasToPngBlob(canvas);

  return {
    blob,
    dataUrl: await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }),
  };
}
