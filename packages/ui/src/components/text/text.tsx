import { Component, Prop, State, h, Host, Element, Event, EventEmitter } from '@stencil/core';
import { marked } from 'marked';
import { messageQueueService } from '../../store/message-queue';

// Prevent raw HTML injection from markdown source (XSS defence)
marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    html({ text }: { text: string }) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  },
});

@Component({
  tag: 'rasa-text',
  styleUrl: 'text.scss',
  shadow: true,
})
export class RasaText {
  /**
   * Text value
   */
  @Prop() value: string;

  /**
   * Disables text parsing (renders text as is, not markdown)
   */
  @Prop() disableParsing = false;

  /**
   * Disables text stream rendering
   */
  @Prop() enableStream = false;

  /**
   * Should component notify messageQueueService at complete rendering
   */
  @Prop() notifyCompleteRendering = false;

  /**
   * User clicked on link
   */
  @Event() linkClicked: EventEmitter<undefined>;

  /**
   * Trigger on stream complete
   */
  @Event() textStreamComplete: EventEmitter<{ value: true }>;

  @Element() el: HTMLRasaTextElement;

  @State() streamedText: string = '';
  @State() streamComplete: boolean = false;

  componentWillLoad() {
    if (!this.enableStream) {
      this.streamComplete = true;
    }
  }

  async componentDidLoad() {
    if (!this.disableParsing && this.enableStream) {
      await this.streamContent();
    } else if (this.notifyCompleteRendering) {
      messageQueueService.completeRendering();
    }
  }

  private async streamContent(): Promise<void> {
    for (let i = 0; i < this.value.length; i++) {
      this.streamedText = this.value.substring(0, i + 1);
      await new Promise(r => setTimeout(r, 30));
    }
    this.streamComplete = true;
    if (this.notifyCompleteRendering) {
      messageQueueService.completeRendering();
      this.textStreamComplete.emit();
    }
  }

  private handleClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) {
      this.linkClicked.emit();
    }
  };

  render() {
    if (this.disableParsing) {
      return (
        <Host>
          <span class="text" part="text">{this.value}</span>
        </Host>
      );
    }

    if (this.enableStream && !this.streamComplete) {
      return (
        <Host>
          <span class="text" part="text">{this.streamedText}</span>
        </Host>
      );
    }

    const html = marked.parse(this.value) as string;
    return (
      <Host>
        <div class="text markdown-body" part="text" onClick={this.handleClick} innerHTML={html}></div>
      </Host>
    );
  }

  // ------------------------------------------------------------- //
}
