export class Comment {
  constructor(
    public readonly id: string,
    public readonly author: Author,
    public readonly content: Content,
    public readonly engagement: Engagement,
    public readonly timestamps: Timestamps,
    public readonly videoId: string,
    public readonly isPinned: boolean = false
  ) {}

  /**
   * 댓글이 최근에 게시되었는지 확인합니다 (24시간 이내).
   */
  isRecent(): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(this.timestamps.publishedAt) > oneDayAgo;
  }

  /**
   * 댓글이 인기 있는지 확인합니다 (좋아요 수 기준).
   */
  isPopular(threshold: number = 100): boolean {
    return this.engagement.likeCount >= threshold;
  }

  /**
   * 댓글이 답글을 가지고 있는지 확인합니다.
   */
  hasReplies(): boolean {
    return this.engagement.replyCount > 0;
  }

  /**
   * 댓글 내용의 길이를 반환합니다.
   */
  getContentLength(): number {
    return this.content.originalText.length;
  }

  /**
   * 댓글이 수정되었는지 확인합니다.
   */
  isEdited(): boolean {
    return this.timestamps.publishedAt !== this.timestamps.updatedAt;
  }

  /**
   * 댓글을 플레인 객체로 변환합니다.
   */
  toPlainObject() {
    return {
      id: this.id,
      author: this.author.toPlainObject(),
      content: this.content.toPlainObject(),
      engagement: this.engagement.toPlainObject(),
      timestamps: this.timestamps.toPlainObject(),
      videoId: this.videoId,
      isPinned: this.isPinned,
    };
  }

  /**
   * 플레인 객체에서 Comment 인스턴스를 생성합니다.
   */
  static fromPlainObject(obj: any): Comment {
    return new Comment(
      obj.id,
      Author.fromPlainObject(obj.author),
      Content.fromPlainObject(obj.content),
      Engagement.fromPlainObject(obj.engagement),
      Timestamps.fromPlainObject(obj.timestamps),
      obj.videoId,
      obj.isPinned
    );
  }
}

export class Author {
  constructor(
    public readonly name: string,
    public readonly profileImage: string,
    public readonly channelUrl?: string,
    public readonly channelId?: string
  ) {}

  /**
   * 작성자가 채널을 가지고 있는지 확인합니다.
   */
  hasChannel(): boolean {
    return !!this.channelUrl && !!this.channelId;
  }

  toPlainObject() {
    return {
      name: this.name,
      profileImage: this.profileImage,
      channelUrl: this.channelUrl,
      channelId: this.channelId,
    };
  }

  static fromPlainObject(obj: any): Author {
    return new Author(
      obj.name,
      obj.profileImage,
      obj.channelUrl,
      obj.channelId
    );
  }
}

export class Content {
  constructor(
    public readonly displayText: string,
    public readonly originalText: string
  ) {}

  /**
   * 콘텐츠에 HTML 태그가 포함되어 있는지 확인합니다.
   */
  hasHtmlTags(): boolean {
    return this.displayText !== this.originalText;
  }

  /**
   * 콘텐츠가 특정 키워드를 포함하는지 확인합니다.
   */
  contains(keyword: string): boolean {
    return this.originalText.toLowerCase().includes(keyword.toLowerCase());
  }

  toPlainObject() {
    return {
      displayText: this.displayText,
      originalText: this.originalText,
    };
  }

  static fromPlainObject(obj: any): Content {
    return new Content(obj.displayText, obj.originalText);
  }
}

export class Engagement {
  constructor(
    public readonly likeCount: number,
    public readonly replyCount: number
  ) {}

  /**
   * 총 참여도를 계산합니다.
   */
  getTotalEngagement(): number {
    return this.likeCount + this.replyCount;
  }

  /**
   * 참여도 비율을 계산합니다 (좋아요 대비 답글).
   */
  getEngagementRatio(): number {
    if (this.likeCount === 0) return 0;
    return this.replyCount / this.likeCount;
  }

  toPlainObject() {
    return {
      likeCount: this.likeCount,
      replyCount: this.replyCount,
    };
  }

  static fromPlainObject(obj: any): Engagement {
    return new Engagement(obj.likeCount, obj.replyCount);
  }
}

export class Timestamps {
  constructor(
    public readonly publishedAt: string,
    public readonly updatedAt: string
  ) {}

  /**
   * 게시 날짜를 Date 객체로 반환합니다.
   */
  getPublishedDate(): Date {
    return new Date(this.publishedAt);
  }

  /**
   * 수정 날짜를 Date 객체로 반환합니다.
   */
  getUpdatedDate(): Date {
    return new Date(this.updatedAt);
  }

  toPlainObject() {
    return {
      publishedAt: this.publishedAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromPlainObject(obj: any): Timestamps {
    return new Timestamps(obj.publishedAt, obj.updatedAt);
  }
} 