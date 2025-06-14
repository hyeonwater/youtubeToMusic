export class Video {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly channelInfo: ChannelInfo,
    public readonly thumbnails: Thumbnails,
    public readonly publishedAt: string,
    public readonly tags: string[] = []
  ) {}

  /**
   * 비디오가 최근에 업로드되었는지 확인합니다 (7일 이내).
   */
  isRecentlyUploaded(): boolean {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(this.publishedAt) > oneWeekAgo;
  }

  /**
   * 비디오 URL을 반환합니다.
   */
  getUrl(): string {
    return `https://www.youtube.com/watch?v=${this.id}`;
  }

  /**
   * 임베드 URL을 반환합니다.
   */
  getEmbedUrl(): string {
    return `https://www.youtube.com/embed/${this.id}`;
  }

  /**
   * 비디오가 특정 태그를 포함하는지 확인합니다.
   */
  hasTag(tag: string): boolean {
    return this.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()));
  }

  /**
   * 제목이나 설명에 특정 키워드를 포함하는지 확인합니다.
   */
  containsKeyword(keyword: string): boolean {
    const lowerKeyword = keyword.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerKeyword) ||
      this.description.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 비디오 정보를 요약합니다.
   */
  getSummary(): VideoSummary {
    return {
      id: this.id,
      title: this.title,
      channelTitle: this.channelInfo.title,
      thumbnailUrl: this.thumbnails.medium.url,
      publishedAt: this.publishedAt,
      url: this.getUrl(),
    };
  }

  /**
   * 비디오를 플레인 객체로 변환합니다.
   */
  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      channelInfo: this.channelInfo.toPlainObject(),
      thumbnails: this.thumbnails.toPlainObject(),
      publishedAt: this.publishedAt,
      tags: this.tags,
    };
  }

  /**
   * 플레인 객체에서 Video 인스턴스를 생성합니다.
   */
  static fromPlainObject(obj: any): Video {
    return new Video(
      obj.id,
      obj.title,
      obj.description,
      ChannelInfo.fromPlainObject(obj.channelInfo),
      Thumbnails.fromPlainObject(obj.thumbnails),
      obj.publishedAt,
      obj.tags
    );
  }
}

export class ChannelInfo {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly url?: string
  ) {}

  /**
   * 채널 URL을 반환합니다.
   */
  getChannelUrl(): string {
    return this.url || `https://www.youtube.com/channel/${this.id}`;
  }

  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
    };
  }

  static fromPlainObject(obj: any): ChannelInfo {
    return new ChannelInfo(obj.id, obj.title, obj.url);
  }
}

export class Thumbnail {
  constructor(
    public readonly url: string,
    public readonly width: number,
    public readonly height: number
  ) {}

  /**
   * 썸네일의 종횡비를 계산합니다.
   */
  getAspectRatio(): number {
    return this.width / this.height;
  }

  /**
   * 썸네일이 고화질인지 확인합니다.
   */
  isHighQuality(): boolean {
    return this.width >= 1280 && this.height >= 720;
  }

  toPlainObject() {
    return {
      url: this.url,
      width: this.width,
      height: this.height,
    };
  }

  static fromPlainObject(obj: any): Thumbnail {
    return new Thumbnail(obj.url, obj.width, obj.height);
  }
}

export class Thumbnails {
  constructor(
    public readonly defaultThumbnail: Thumbnail,
    public readonly medium: Thumbnail,
    public readonly high: Thumbnail,
    public readonly standard?: Thumbnail,
    public readonly maxres?: Thumbnail
  ) {}

  /**
   * 최고 화질의 썸네일을 반환합니다.
   */
  getBestQuality(): Thumbnail {
    return this.maxres || this.standard || this.high;
  }

  /**
   * 특정 크기에 가장 적합한 썸네일을 반환합니다.
   */
  getBestFit(targetWidth: number): Thumbnail {
    const thumbnails = [this.defaultThumbnail, this.medium, this.high, this.standard, this.maxres]
      .filter(Boolean) as Thumbnail[];

    return thumbnails.reduce((best, current) => {
      const bestDiff = Math.abs(best.width - targetWidth);
      const currentDiff = Math.abs(current.width - targetWidth);
      return currentDiff < bestDiff ? current : best;
    });
  }

  toPlainObject() {
    return {
      defaultThumbnail: this.defaultThumbnail.toPlainObject(),
      medium: this.medium.toPlainObject(),
      high: this.high.toPlainObject(),
      standard: this.standard?.toPlainObject(),
      maxres: this.maxres?.toPlainObject(),
    };
  }

  static fromPlainObject(obj: any): Thumbnails {
    return new Thumbnails(
      Thumbnail.fromPlainObject(obj.defaultThumbnail || obj.default),
      Thumbnail.fromPlainObject(obj.medium),
      Thumbnail.fromPlainObject(obj.high),
      obj.standard ? Thumbnail.fromPlainObject(obj.standard) : undefined,
      obj.maxres ? Thumbnail.fromPlainObject(obj.maxres) : undefined
    );
  }
}

// 유틸리티 타입
export interface VideoSummary {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
} 