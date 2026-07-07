import { API_BASE } from './mongoService';
import { ForumCategory, ForumThread, ForumPost, User } from '../types';

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Forum API ${path} failed [${res.status}]: ${errText}`);
  }
  return res.json();
};

export const forumService = {
  // --- CATEGORIES ---
  fetchCategories: async (): Promise<ForumCategory[]> => {
    try {
      return await apiFetch<ForumCategory[]>('/forum/categories');
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  updateCategories: async (categories: ForumCategory[]): Promise<void> => {
    try {
      await apiFetch<void>('/forum/categories', {
        method: 'PUT',
        body: JSON.stringify(categories)
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  createCategory: async (category: ForumCategory): Promise<void> => {
    try {
      await apiFetch<void>('/forum/categories', {
        method: 'POST',
        body: JSON.stringify(category)
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  updateCategory: async (categoryId: string, updates: Partial<ForumCategory>): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/categories/${categoryId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // --- THREADS ---
  fetchThreads: async (categoryId?: string, type?: string): Promise<ForumThread[]> => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      if (type) params.set('type', type);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await apiFetch<ForumThread[]>(`/forum/threads${query}`);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchThread: async (threadId: string): Promise<ForumThread> => {
    try {
      return await apiFetch<ForumThread>(`/forum/threads/${threadId}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  fetchRelatedThreads: async (threadId: string): Promise<ForumThread[]> => {
    try {
      return await apiFetch<ForumThread[]>(`/forum/threads/${threadId}/related`);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createThread: async (thread: ForumThread, firstPost: ForumPost, userId: string, currentAp: number, currentTotalAp: number): Promise<{ success: boolean, threadId?: string }> => {
    try {
      const resp = await apiFetch<{ success: boolean, threadId?: string }>('/forum/threads', {
        method: 'POST',
        body: JSON.stringify({ thread, firstPost, userId, currentAp, currentTotalAp })
      });

      // Trigger mentions asynchronously after creation
      const { notificationService } = await import('./notificationService');
      notificationService.handleMentions(
        firstPost.content,
        { id: firstPost.authorId, name: firstPost.authorName, avatar: firstPost.authorAvatar },
        `/forum/thread/${thread.id}`,
        `topic "${thread.title}"`
      ).catch(err => console.warn('Mention processing error:', err));

      return resp;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  updateThread: async (threadId: string, updates: Partial<ForumThread>): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/threads/${threadId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  deleteThread: async (threadId: string): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/threads/${threadId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // --- CRICKET MATCH HELPERS ---

  /** Create a new cricket match forum thread */
  createCricketMatchThread: async (
    title: string,
    matchData: any,
    creator: User,
    team1Name: string,
    team2Name: string
  ): Promise<{ success: boolean; threadId?: string }> => {
    const now = Date.now();
    const thread: any = {
      id: '',
      categoryId: 'cricket',
      authorId: creator.id,
      authorName: creator.name || creator.username,
      authorAvatar: creator.avatar,
      title,
      tags: ['cricket', 'live-match'],
      isPinned: false,
      isLocked: false,
      views: 0,
      replyCount: 0,
      lastActivity: now,
      createdAt: now,
      type: 'cricket_match',
      cricketMatchData: matchData,
      cricketMatchPhase: 'live',
      cricketMatchWinner: '',
      cricketTeam1Name: team1Name,
      cricketTeam2Name: team2Name,
    };

    const firstPost: any = {
      id: 'P' + now,
      threadId: '',
      authorId: creator.id,
      authorName: creator.name || creator.username,
      authorAvatar: creator.avatar,
      content: `🏏 **${title}** — Live Cricket Match\n\n**${team1Name}** vs **${team2Name}**\n\nMatch is now LIVE! Score updates will appear here.`,
      timestamp: now,
      reactions: {},
      userReactions: {},
      likedBy: [],
      postType: 'text',
      isHidden: false,
    };

    try {
      const resp = await apiFetch<{ success: boolean; threadId?: string }>('/forum/threads', {
        method: 'POST',
        body: JSON.stringify({ thread, firstPost, userId: creator.id, currentAp: creator.ap || 0, currentTotalAp: creator.totalAp || 0 })
      });
      return resp;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  /** Update the match state on an existing cricket thread */
  updateCricketMatch: async (
    threadId: string,
    matchData: any,
    phase: string,
    winner?: string,
    team1Name?: string,
    team2Name?: string
  ): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/threads/${threadId}/cricket-match`, {
        method: 'PATCH',
        body: JSON.stringify({ matchData, phase, winner, team1Name, team2Name })
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  /** Reveal all hidden posts in a thread (call on match complete) */
  revealAllPosts: async (threadId: string): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/threads/${threadId}/reveal-all`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  },

  /** Reveal hidden posts for a specific over */
  revealOverPosts: async (threadId: string, overNum: number): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/threads/${threadId}/reveal-over`, {
        method: 'POST',
        body: JSON.stringify({ overNum })
      });
    } catch (e) {
      console.error(e);
    }
  },

  /** Create a hidden digit post (bat or bowl) */
  createHiddenPost: async (
    threadId: string,
    author: User,
    content: string,
    postType: 'bat_digit' | 'bowl_digit',
    overNum: number
  ): Promise<any> => {
    try {
      return await apiFetch<any>('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({
          threadId,
          author,
          content,
          postType,
          isHidden: true,
          overNum,
          currentAp: author.ap || 0,
          currentTotalAp: author.totalAp || 0
        })
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  /** Fetch cricket match threads from the forum */
  fetchCricketMatches: async (): Promise<ForumThread[]> => {
    try {
      return await apiFetch<ForumThread[]>('/forum/threads?type=cricket_match');
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // --- POSTS ---
  fetchPosts: async (threadId: string, requesterId?: string): Promise<ForumPost[]> => {
    try {
      const params = new URLSearchParams({ threadId });
      if (requesterId) params.set('requesterId', requesterId);
      return await apiFetch<ForumPost[]>(`/forum/posts?${params.toString()}`);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createPost: async (threadId: string, author: User, content: string, currentAp: number, currentTotalAp: number): Promise<ForumPost> => {
    try {
      const newPost = await apiFetch<ForumPost>('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({ threadId, author, content, currentAp, currentTotalAp })
      });

      const { notificationService } = await import('./notificationService');

      try {
        const thread = await forumService.fetchThread(threadId);
        if (author.id !== thread.authorId) {
          notificationService.sendNotification(
            thread.authorId,
            'MENTION',
            { id: author.id, name: author.name, avatar: author.avatar },
            `replied to your topic "${thread.title.substring(0, 25)}...": "${content.substring(0, 30)}..."`,
            `/forum/thread/${threadId}`
          ).catch(err => console.warn('Reply notification error:', err));
        }

        notificationService.handleMentions(
          content,
          { id: author.id, name: author.name, avatar: author.avatar },
          `/forum/thread/${threadId}`,
          `reply in topic "${thread.title}"`
        ).catch(err => console.warn('Mention processing error:', err));
      } catch (_) {}

      return newPost;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  updatePost: async (threadId: string, postId: string, content: string, editedBy?: string, editedByAvatar?: string, isMainPost?: boolean): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content, editedBy, editedByAvatar, isMainPost })
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  deletePost: async (threadId: string, postId: string): Promise<void> => {
    try {
      await apiFetch<void>(`/forum/posts/${postId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // --- REACTIONS ---
  toggleReaction: async (postId: string, emoji: string, userId: string): Promise<{ reactions: Record<string, number>, userReactions: Record<string, string> }> => {
    try {
      return await apiFetch(`/forum/posts/${postId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji, userId })
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // --- STATS ENGINE ---
  fetchForumStats: async () => {
    try {
      return await apiFetch<any>('/forum/stats');
    } catch (e) {
      console.error(e);
      return {
        weeklyTopPoster: 'Loading...',
        lastPost: 'Loading...',
        lastPostThreadId: null,
        randomTopic: 'Loading...',
        randomTopicId: null,
        totalUsers: 0,
        totalPosts: 0,
        totalThreads: 0,
        totalPostsDisplay: 0
      };
    }
  }
};
