import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type WorkflowStep = 'input' | 'post-review' | 'poster-review' | 'publish';

interface WorkflowState {
  step: WorkflowStep;
  inputText: string;
  inputImageUrl: string | null;
  generatedPost: string;
  posterUrl: string | null;
  isLoading: boolean;
}

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>({
    step: 'input',
    inputText: '',
    inputImageUrl: null,
    generatedPost: '',
    posterUrl: null,
    isLoading: false,
  });

  const setLoading = (isLoading: boolean) => setState(prev => ({ ...prev, isLoading }));

  const generatePost = useCallback(async (text: string, imageUrl?: string | null, feedback?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: { inputText: text, inputImageUrl: imageUrl, feedback },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setState(prev => ({
        ...prev,
        inputText: text,
        inputImageUrl: imageUrl || null,
        generatedPost: data.generatedPost,
        step: 'post-review',
        isLoading: false,
      }));
    } catch (e: any) {
      toast({ title: "Error generating post", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  }, []);

  const approvePost = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-poster', {
        body: { postContent: state.generatedPost },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setState(prev => ({
        ...prev,
        posterUrl: data.posterUrl,
        step: 'poster-review',
        isLoading: false,
      }));
    } catch (e: any) {
      toast({ title: "Error generating poster", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  }, [state.generatedPost]);

  const revisePost = useCallback(async (feedback: string) => {
    await generatePost(state.inputText, state.inputImageUrl, feedback);
  }, [state.inputText, state.inputImageUrl, generatePost]);

  const approvePoster = useCallback(() => {
    setState(prev => ({ ...prev, step: 'publish' }));
  }, []);

  const revisePoster = useCallback(async (feedback: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-poster', {
        body: { postContent: state.generatedPost, feedback },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setState(prev => ({
        ...prev,
        posterUrl: data.posterUrl,
        isLoading: false,
      }));
    } catch (e: any) {
      toast({ title: "Error revising poster", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  }, [state.generatedPost]);

  const sendToTelegram = useCallback(async (chatId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          chatId,
          postText: state.generatedPost,
          posterUrl: state.posterUrl,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: "Posted successfully! 🎉", description: "Your post has been sent to Telegram." });
      // Reset
      setState({
        step: 'input',
        inputText: '',
        inputImageUrl: null,
        generatedPost: '',
        posterUrl: null,
        isLoading: false,
      });
    } catch (e: any) {
      toast({ title: "Error sending to Telegram", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  }, [state.generatedPost, state.posterUrl]);

  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: { action: 'getUpdates' },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.chats || [];
    } catch (e: any) {
      toast({ title: "Error fetching groups", description: e.message, variant: "destructive" });
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      step: 'input',
      inputText: '',
      inputImageUrl: null,
      generatedPost: '',
      posterUrl: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    generatePost,
    approvePost,
    revisePost,
    approvePoster,
    revisePoster,
    sendToTelegram,
    fetchGroups,
    reset,
  };
}
