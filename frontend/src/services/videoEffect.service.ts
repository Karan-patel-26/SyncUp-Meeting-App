// Using global SelfieSegmentation from CDN script in index.html
const SelfieSegmentation = (window as any).SelfieSegmentation;

export type EffectType = 'none' | 'blur' | 'office' | 'studio' | 'minimal';

class VideoEffectService {
  private segmentation: any = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private currentEffect: EffectType = 'none';
  private backgroundImage: HTMLImageElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;

    this.segmentation = new SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    this.segmentation.setOptions({
      modelSelection: 1, // 0 for general, 1 for landscape
      selfieMode: false,
    });

    this.segmentation.onResults(this.onResults.bind(this));
  }

  private onResults(results: any) {
    const { ctx, canvas, currentEffect, backgroundImage } = this;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw segmentation mask
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // Draw Foreground (the person)
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw Background
    ctx.globalCompositeOperation = 'destination-over';
    
    if (currentEffect === 'blur') {
      ctx.filter = 'blur(10px)';
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Default fallback (original background)
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }

  public async startEffect(inputStream: MediaStream, effect: EffectType): Promise<MediaStream> {
    this.stream = inputStream;
    this.currentEffect = effect;

    if (effect === 'none') return inputStream;

    // Load background image if needed
    if (['office', 'studio', 'minimal'].includes(effect)) {
      this.backgroundImage = new Image();
      this.backgroundImage.src = this.getBackgroundUrl(effect);
      await new Promise((resolve) => (this.backgroundImage!.onload = resolve));
    } else {
      this.backgroundImage = null;
    }

    const videoTrack = inputStream.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    this.canvas.width = width || 1280;
    this.canvas.height = height || 720;
    
    this.video.srcObject = inputStream;
    await this.video.play();

    this.renderLoop();

    return this.canvas.captureStream(30);
  }

  private async renderLoop() {
    if (!this.stream || this.currentEffect === 'none') return;
    
    await this.segmentation?.send({ image: this.video });
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  private getBackgroundUrl(effect: EffectType): string {
    const urls: Record<string, string> = {
      office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80',
      studio: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1280&q=80',
      minimal: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1280&q=80',
    };
    return urls[effect] || '';
  }

  public stopEffect() {
    this.currentEffect = 'none';
    this.stream = null;
  }
}

export const videoEffectService = new VideoEffectService();
