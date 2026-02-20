/**
 * MCP音乐播放管理器
 * 专门用于处理MCP工具生成的音乐URL自动播放
 */

interface MCPMusicInfo {
  taskId: string;
  title: string;
  musicId: string;
  model: string;
  mode: string;
  type: string;
  streamUrl: string;
  timestamp: number;
}

class MCPMusicManager {
  private currentMusicAudio: HTMLAudioElement | null = null;
  private musicHistory: MCPMusicInfo[] = [];
  private isPlaying: boolean = false;
  private volume: number = 0.5; // 默认音量50%
  private processedTaskIds: Set<string> = new Set(); // 防止重复处理同一个任务
  private userHasInteracted: boolean = false; // 用户是否已经与页面交互

  /**
   * 解析MCP工具结果，提取音乐信息
   */
  parseMusicResult(toolResult: string): MCPMusicInfo | null {
    try {
      // 更精确地提取标题（在第一行或"🆔"之前的内容）
      let cleanTitle = '未知音乐';

      // 方法1：如果有明确的"音乐标题"字段
      const explicitTitleMatch = toolResult.match(/音乐标题[：:\s]*([^\n\r🆔]+)/);
      if (explicitTitleMatch) {
        cleanTitle = explicitTitleMatch[1].trim();
      } else {
        // 方法2：取第一行作为标题（如果包含中文字符且不是URL或ID）
        const firstLineMatch = toolResult.match(/^([^\n\r🆔🎼🎶📱⏱️💡]+)/);
        if (firstLineMatch && firstLineMatch[1]) {
          const firstLine = firstLineMatch[1].trim();
          // 检查是否是有效的标题（包含中文字符，不是URL）
          if (/[\u4e00-\u9fa5]/.test(firstLine) && !firstLine.startsWith('http')) {
            cleanTitle = firstLine;
          }
        }
      }

      // 其他字段的提取
      const musicIdMatch = toolResult.match(/🆔[^:：]*[：:\s]*([a-f0-9-]+)/);
      const modelMatch = toolResult.match(/🎼[^:：]*模型[：:\s]*([^\n\r🎶]+)/);
      const modeMatch = toolResult.match(/🎶[^:：]*模式[：:\s]*([^\n\r🎼]+)/);
      const typeMatch = toolResult.match(/🎼[^:：]*类型[：:\s]*([^\n\r⏱️]+)/);
      const streamUrlMatch = toolResult.match(/📱[^:：]*流式播放URL[：:\s]*(https?:\/\/[^\s\n\r💡]+)/);

      if (!streamUrlMatch || !streamUrlMatch[1]) {
        console.log('[MCPMusicManager] 未找到流式播放URL');
        return null;
      }

      const musicInfo: MCPMusicInfo = {
        taskId: musicIdMatch?.[1]?.trim() || `music_${Date.now()}`, // 使用音乐ID作为任务ID，避免重复处理
        title: cleanTitle,
        musicId: musicIdMatch?.[1]?.trim() || '',
        model: modelMatch?.[1]?.trim() || '',
        mode: modeMatch?.[1]?.trim() || '',
        type: typeMatch?.[1]?.trim() || '',
        streamUrl: streamUrlMatch[1].trim(),
        timestamp: Date.now()
      };

      return musicInfo;
    } catch (error) {
      console.error('[MCPMusicManager] 解析音乐结果失败:', error);
      return null;
    }
  }

  /**
   * 检测工具结果是否包含音乐生成信息
   */
  isMusicGenerationResult(toolName: string, result: any): boolean {
    if (toolName !== 'suno-generate-music-with-stream') {
      return false;
    }

    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);

    // 检查是否包含成功生成音乐的关键字
    return resultStr.includes('音乐生成并获取流式URL成功') &&
           resultStr.includes('流式播放URL:');
  }

  /**
   * 准备音乐并尝试自动播放
   */
  async prepareMusic(musicInfo: MCPMusicInfo, autoPlay: boolean = false): Promise<void> {
    try {
      // 停止当前播放的音乐
      this.stopCurrentMusic();

      console.log(`[MCPMusicManager] 准备音乐: ${musicInfo.title}`);

      // 创建新的音频元素
      const audio = new Audio(musicInfo.streamUrl);
      audio.volume = this.volume;
      audio.crossOrigin = 'anonymous'; // 处理跨域问题
      audio.preload = 'metadata'; // 预加载元数据

      this.currentMusicAudio = audio;
      this.isPlaying = false;

      // 设置事件监听器
      audio.addEventListener('loadstart', () => {
        console.log(`[MCPMusicManager] 开始加载音乐: ${musicInfo.title}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`[MCPMusicManager] 音乐可以播放: ${musicInfo.title}`);

        // 如果启用自动播放，在音乐可以播放时立即播放
        if (autoPlay) {
          this.tryAutoPlay(musicInfo.title);
        }
      });

      audio.addEventListener('playing', () => {
        console.log(`[MCPMusicManager] 音乐开始播放: ${musicInfo.title}`);
        this.isPlaying = true;
      });

      audio.addEventListener('pause', () => {
        console.log(`[MCPMusicManager] 音乐暂停: ${musicInfo.title}`);
        this.isPlaying = false;
      });

      audio.addEventListener('ended', () => {
        console.log(`[MCPMusicManager] 音乐播放完成: ${musicInfo.title}`);
        this.isPlaying = false;
      });

      audio.addEventListener('error', (error) => {
        console.error(`[MCPMusicManager] 音乐播放错误: ${musicInfo.title}`, error);
        this.isPlaying = false;
        this.currentMusicAudio = null;
        // 从处理过的任务列表中移除，允许重试
        this.processedTaskIds.delete(musicInfo.taskId);
      });

      // 添加到历史记录
      this.addToHistory(musicInfo);

      console.log(`[MCPMusicManager] 音乐准备完成: ${musicInfo.title}`);
    } catch (error) {
      console.error('[MCPMusicManager] 准备音乐失败:', error);
      this.isPlaying = false;
      this.currentMusicAudio = null;
      throw error;
    }
  }

  /**
   * 尝试自动播放音乐
   */
  private async tryAutoPlay(title: string): Promise<void> {
    if (!this.currentMusicAudio) {
      return;
    }

    try {
      await this.currentMusicAudio.play();
      this.isPlaying = true;
      this.userHasInteracted = true;
      console.log(`[MCPMusicManager] 自动播放成功: ${title}`);
    } catch (error) {
      console.warn(`[MCPMusicManager] 自动播放失败 (浏览器限制): ${title}`, error);
      console.log(`[MCPMusicManager] 音乐已准备就绪，请点击播放按钮开始播放: ${title}`);
      this.isPlaying = false;
    }
  }

  /**
   * 停止当前音乐播放
   */
  stopCurrentMusic(): void {
    if (this.currentMusicAudio) {
      console.log('[MCPMusicManager] 停止当前音乐播放');
      this.currentMusicAudio.pause();
      this.currentMusicAudio.src = '';
      this.currentMusicAudio.load();
      this.currentMusicAudio = null;
      this.isPlaying = false;
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = this.volume;
    }
    console.log(`[MCPMusicManager] 设置音量: ${this.volume * 100}%`);
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 检查是否正在播放音乐
   */
  isPlayingMusic(): boolean {
    // 如果有音频元素且正在播放，返回true
    if (this.currentMusicAudio && this.isPlaying) {
      return true;
    }

    // 检查音频元素的实际播放状态
    if (this.currentMusicAudio && !this.currentMusicAudio.paused && !this.currentMusicAudio.ended) {
      this.isPlaying = true; // 同步状态
      return true;
    }

    return false;
  }

  /**
   * 检查是否有音乐可用（准备好播放或正在播放）
   */
  hasMusicAvailable(): boolean {
    return this.currentMusicAudio !== null && this.musicHistory.length > 0;
  }

  /**
   * 获取当前播放信息
   */
  getCurrentPlayingInfo(): MCPMusicInfo | null {
    // 只要有音乐历史记录就返回最新的音乐信息，不管是否正在播放
    if (this.musicHistory.length === 0) {
      return null;
    }
    return this.musicHistory[this.musicHistory.length - 1];
  }

  /**
   * 获取当前音频元素（供音乐控制器使用）
   */
  getCurrentAudioElement(): HTMLAudioElement | null {
    return this.currentMusicAudio;
  }

  /**
   * 暂停当前音乐
   */
  pauseCurrentMusic(): void {
    if (this.currentMusicAudio && this.isPlaying) {
      this.currentMusicAudio.pause();
      this.isPlaying = false;
      console.log('[MCPMusicManager] 暂停音乐播放');
    }
  }

  /**
   * 开始/恢复当前音乐播放
   */
  resumeCurrentMusic(): void {
    if (!this.currentMusicAudio) {
      console.log('[MCPMusicManager] 没有可用的音频元素');
      return;
    }

    if (this.isPlaying) {
      console.log('[MCPMusicManager] 音乐已经在播放中');
      return;
    }

    // 检查音频元素是否有效
    if (this.currentMusicAudio.error) {
      console.error('[MCPMusicManager] 音频元素有错误，无法播放:', this.currentMusicAudio.error);
      this.currentMusicAudio = null;
      this.isPlaying = false;
      return;
    }

    this.currentMusicAudio.play().then(() => {
      this.isPlaying = true;
      this.userHasInteracted = true; // 标记用户已经交互
      console.log('[MCPMusicManager] 开始/恢复音乐播放成功');
    }).catch((error) => {
      console.error('[MCPMusicManager] 开始/恢复播放失败:', error);
      this.isPlaying = false;
    });
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(musicInfo: MCPMusicInfo): void {
    this.musicHistory.push(musicInfo);
    // 保持历史记录不超过20条
    if (this.musicHistory.length > 20) {
      this.musicHistory = this.musicHistory.slice(-20);
    }
  }

  /**
   * 获取音乐播放历史
   */
  getMusicHistory(): MCPMusicInfo[] {
    return [...this.musicHistory];
  }

  /**
   * 清除音乐历史
   */
  clearHistory(): void {
    this.musicHistory = [];
    console.log('[MCPMusicManager] 清除音乐播放历史');
  }

  /**
   * 处理MCP工具结果，自动播放音乐
   */
  async handleMCPToolResult(toolName: string, result: any): Promise<void> {
    if (!this.isMusicGenerationResult(toolName, result)) {
      return;
    }

    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
    const musicInfo = this.parseMusicResult(resultStr);

    if (musicInfo) {
      // 检查是否已经处理过这个任务
      if (this.processedTaskIds.has(musicInfo.taskId)) {
        console.log(`[MCPMusicManager] 任务 ${musicInfo.taskId} 已经处理过，跳过重复处理`);
        return;
      }

      // 标记为已处理
      this.processedTaskIds.add(musicInfo.taskId);

      try {
        await this.prepareMusic(musicInfo, true); // 启用自动播放
        console.log(`[MCPMusicManager] MCP生成的音乐已准备并尝试自动播放: ${musicInfo.title}`);
      } catch (error) {
        console.error('[MCPMusicManager] 准备音乐失败:', error);
      }
    }
  }
}

// 导出单例实例
export const mcpMusicManager = new MCPMusicManager();

// 导出类型
export type { MCPMusicInfo };