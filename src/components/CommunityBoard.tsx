import { useState, useEffect, FormEvent, MouseEvent } from "react";
import { useAuth } from "./AuthContext";
import { ARTWORKS, ITINERARIES } from "../constants";
import { useLanguage } from "./LanguageContext";
import { Artwork, Itinerary } from "../types";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  Send,
  Loader2,
  Bookmark,
  MessageCircle,
  Clock,
  User,
  ExternalLink
} from "lucide-react";

// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
try {
  // @ts-ignore
  if (window.supabase) {
    // @ts-ignore
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Failed to initialize Supabase inside CommunityBoard:", err);
}

interface CommunityBoardProps {
  onBack: () => void;
  onSelectArtworkById: (id: string) => void;
  onNavigateToItineraries: () => void;
  onTriggerLogin: () => void;
}

export type ForumCategory = "Tutti" | "Esperienze" | "Consigli" | "Segnalazioni" | "Domande";

export function CommunityBoard({ 
  onBack, 
  onSelectArtworkById, 
  onNavigateToItineraries,
  onTriggerLogin
}: CommunityBoardProps) {
  const { user, profile } = useAuth();
  const { t, translateArtwork, translateItinerary } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory>("Tutti");
  const [errorMsg, setErrorMsg] = useState("");

  // Detailed view state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);

  // New post state
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postCategory, setPostCategory] = useState<Exclude<ForumCategory, "Tutti">>("Esperienze");
  const [postArtworkId, setPostArtworkId] = useState("");
  const [postItineraryId, setPostItineraryId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch all posts
  const fetchPosts = async () => {
    if (!supabase) {
      setErrorMsg(t("Connection to Supabase not available."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          *,
          profiles (
            first_name,
            last_name
          ),
          forum_replies (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (err: any) {
      console.error("Error loading posts:", err);
      setErrorMsg(t("An error occurred while loading posts."));
    } finally {
      setLoading(false);
    }
  };

  // Fetch details of a single post
  const fetchPostDetails = async (postId: string) => {
    if (!supabase) return;
    try {
      setErrorMsg("");
      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          *,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq("id", postId)
        .single();

      if (error) throw error;
      setSelectedPost(data);

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("forum_replies")
        .select(`
          *,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;
      setReplies(repliesData || []);
    } catch (err: any) {
      console.error("Error loading post detail:", err);
      setErrorMsg(t("Unable to load post details."));
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPostId) {
      fetchPostDetails(selectedPostId);
    } else {
      setSelectedPost(null);
      setReplies([]);
    }
  }, [selectedPostId]);

  // Handle New Post submission
  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onTriggerLogin();
      return;
    }

    if (!postTitle.trim() || !postBody.trim()) {
      setErrorMsg(t("Please fill in all required post fields."));
      return;
    }

    setCreateLoading(true);
    setErrorMsg("");
    try {
      const newPostPayload = {
        user_id: user.id,
        title: postTitle.trim(),
        body: postBody.trim(),
        category: postCategory,
        artwork_id: postArtworkId || null,
        itinerary_id: postItineraryId || null
      };

      const { data, error } = await supabase
        .from("forum_posts")
        .insert([newPostPayload])
        .select();

      if (error) throw error;

      // Clean inputs
      setPostTitle("");
      setPostBody("");
      setPostCategory("Esperienze");
      setPostArtworkId("");
      setPostItineraryId("");
      setIsCreatingPost(false);

      // Reload
      await fetchPosts();
    } catch (err: any) {
      console.error("Error creating post:", err);
      setErrorMsg(t("Error creating post. Please try again."));
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Post Deletion
  const handleDeletePost = async (postId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!supabase || !user) return;
    if (!window.confirm(t("Are you sure you want to delete this post and all of its replies?"))) return;

    try {
      // Delete replies first
      await supabase
        .from("forum_replies")
        .delete()
        .eq("post_id", postId);

      // Delete post
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      if (selectedPostId === postId) {
        setSelectedPostId(null);
      }
      fetchPosts();
    } catch (err: any) {
      console.error("Error deleting post:", err);
      setErrorMsg(t("Error deleting post."));
    }
  };

  // Handle Reply submission
  const handleAddReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onTriggerLogin();
      return;
    }

    if (!replyBody.trim() || !selectedPostId) return;

    setReplyLoading(true);
    try {
      const { error } = await supabase
        .from("forum_replies")
        .insert([{
          post_id: selectedPostId,
          user_id: user.id,
          body: replyBody.trim()
        }]);

      if (error) throw error;
      setReplyBody("");
      fetchPostDetails(selectedPostId);

      // Update posts replies count list locally or refetch
      fetchPosts();
    } catch (err: any) {
      console.error("Error submitting reply:", err);
      setErrorMsg(t("Unable to post reply."));
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle Reply Deletion
  const handleDeleteReply = async (replyId: string) => {
    if (!supabase || !user || !selectedPostId) return;
    if (!window.confirm(t("Are you sure you want to delete this reply?"))) return;

    try {
      const { error } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", replyId)
        .eq("user_id", user.id);

      if (error) throw error;
      fetchPostDetails(selectedPostId);
      fetchPosts();
    } catch (err: any) {
      console.error("Error deleting reply:", err);
      setErrorMsg(t("Error deleting reply."));
    }
  };

  // Filter posts based on Category
  const filteredPosts = posts.filter(post => {
    if (activeCategory === "Tutti") return true;
    return post.category === activeCategory;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Tutti": return t("All");
      case "Esperienze": return t("Experiences");
      case "Consigli": return t("Tips");
      case "Segnalazioni": return t("Reports");
      case "Domande": return t("Questions");
      default: return t(cat);
    }
  };

  // Get localized artwork name
  const getArtworkName = (id: string) => {
    const art = ARTWORKS.find(a => a.id === id);
    return art ? translateArtwork(art).title : id;
  };

  // Get localized itinerary name
  const getItineraryName = (id: string) => {
    const itinerary = ITINERARIES.find(i => i.id === id);
    return itinerary ? translateItinerary(itinerary).title : id;
  };

  // Render a single post card
  const renderPostCard = (post: any) => {
    const authorName = post.profiles 
      ? `${post.profiles.first_name || ""} ${post.profiles.last_name || ""}`.trim() 
      : "Contributor";

    const dateStr = new Date(post.created_at).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const repliesCount = post.forum_replies ? post.forum_replies.length : 0;

    return (
      <div 
        key={post.id}
        onClick={() => setSelectedPostId(post.id)}
        className="bg-white border border-border-color p-5 hover:border-accent-gold transition-all duration-300 shadow-sm cursor-pointer relative group flex flex-col justify-between"
      >
        <div>
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-1 bg-accent-gold/10 text-accent-gold text-[9px] uppercase tracking-wider font-extrabold rounded-none">
              {getCategoryLabel(post.category)}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-light font-mono">
              <Clock size={12} className="text-accent-gold/60" />
              <span>{dateStr}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-serif font-black text-sidebar-bg group-hover:text-accent-gold transition-colors line-clamp-2 leading-snug mb-2">
            {post.title}
          </h3>

          {/* Body preview */}
          <p className="text-xs text-text-light font-light leading-relaxed line-clamp-3 mb-4">
            {post.body}
          </p>
        </div>

        <div>
          {/* Connections */}
          {(post.artwork_id || post.itinerary_id) && (
            <div className="border-t border-border-color/60 pt-3 mt-2 mb-4 space-y-1.5">
              {post.artwork_id && (
                <div className="flex items-center gap-1.5 text-[10px] text-sidebar-bg/85 font-semibold">
                  <Bookmark size={11} className="text-accent-gold" />
                  <span className="truncate">{t("Artwork")}: <span className="text-accent-gold italic">{getArtworkName(post.artwork_id)}</span></span>
                </div>
              )}
              {post.itinerary_id && (
                <div className="flex items-center gap-1.5 text-[10px] text-sidebar-bg/85 font-semibold">
                  <MapPin size={11} className="text-emerald-600" />
                  <span className="truncate">{t("Itinerary")}: <span className="text-emerald-600 italic">{getItineraryName(post.itinerary_id)}</span></span>
                </div>
              )}
            </div>
          )}

          {/* Footer details */}
          <div className="flex items-center justify-between mt-auto border-t border-border-color/40 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-sidebar-bg/5 flex items-center justify-center text-[10px] font-bold text-accent-gold uppercase font-serif border border-accent-gold/25">
                {authorName.charAt(0)}
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-sidebar-bg/80">
                {authorName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-text-light font-bold">
                <MessageCircle size={13} className="text-accent-gold/80" />
                <span>{repliesCount} {repliesCount === 1 ? t('reply') : t('replies')}</span>
              </div>

              {user && post.user_id === user.id && (
                <button
                  onClick={(e) => handleDeletePost(post.id, e)}
                  className="p-1.5 text-text-light hover:text-red-600 rounded-sm hover:bg-red-50 transition-all cursor-pointer"
                  title={t("Delete post")}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-bg-canvas overflow-hidden relative">
      
      {/* ERROR MESSAGE TOAST BAR */}
      {errorMsg && (
        <div className="bg-[#A41034] text-white px-6 py-3 text-xs tracking-wider flex items-center justify-between shrink-0 z-55">
          <span className="font-semibold">{errorMsg}</span>
          <button 
            onClick={() => setErrorMsg("")} 
            className="text-white/80 hover:text-white font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}      {/* HEADER SECTION */}
      <div className="bg-sidebar-bg text-white py-10 px-6 md:px-12 border-b border-white/10 shrink-0 relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif italic text-3xl md:text-4xl text-accent-gold flex items-center gap-2">
            <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-accent-gold shrink-0 stroke-[1.5]" />
            {t("Community Board")}
          </h2>
          <p className="text-xs text-white/60 uppercase tracking-widest font-mono mt-1.5">
            {t("Share experiences, tips, reports, and questions about Torino Nascosta")}
          </p>
        </div>

        <div className="flex gap-3">
          {selectedPostId || isCreatingPost ? (
            <button
              onClick={() => {
                setSelectedPostId(null);
                setIsCreatingPost(false);
              }}
              className="px-5 py-2.5 border border-white/20 hover:border-accent-gold text-white/85 hover:text-accent-gold uppercase tracking-widest text-[9.5px] font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> {t("Back to posts")}
            </button>
          ) : (
            <button
              onClick={() => {
                if (!user) {
                  onTriggerLogin();
                } else {
                  setIsCreatingPost(true);
                }
              }}
              className="px-5 py-2.5 bg-accent-gold text-sidebar-bg hover:bg-accent-gold/90 font-black uppercase tracking-widest text-[9.5px] shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> {t("New post")}
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-grow flex flex-col overflow-hidden min-h-0 min-w-0">
        
        {/* VIEW A: CREATE POST FORM */}
        {isCreatingPost ? (
          <div className="flex-grow overflow-auto p-6 md:p-12 max-w-3xl mx-auto w-full">
            <div className="bg-white border border-border-color p-6 md:p-10 shadow-sm">
              <h3 className="font-serif italic text-2xl text-sidebar-bg mb-6 pb-2 border-b border-border-color">
                {t("Write a message for the community")}
              </h3>

              <form onSubmit={handleCreatePost} className="space-y-6 text-xs font-sans">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block font-black uppercase tracking-wider text-text-light">
                    {t("Post Title")} <span className="text-[#A41034]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder={t("e.g., Does anyone know if the courtyard of the Piercing Palace is accessible?")}
                    className="w-full p-3 border border-border-color focus:border-accent-gold outline-none text-xs rounded-none bg-bg-canvas font-sans text-text-main"
                  />
                </div>

                {/* Grid layout for Category & Connections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                  
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block font-black uppercase tracking-wider text-text-light font-sans">
                      {t("Category")} <span className="text-[#A41034]">*</span>
                    </label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value as any)}
                      className="w-full p-3 border border-border-color focus:border-accent-gold outline-none text-xs rounded-none bg-bg-canvas font-sans text-text-main font-semibold"
                    >
                      <option value="Esperienze">{t("Experiences")}</option>
                      <option value="Consigli">{t("Tips")}</option>
                      <option value="Segnalazioni">{t("Reports")}</option>
                      <option value="Domande">{t("Questions")}</option>
                    </select>
                  </div>

                  {/* Artwork */}
                  <div className="space-y-1.5">
                    <label className="block font-black uppercase tracking-wider text-text-light font-sans">
                      {t("Link an Artwork (Optional)")}
                    </label>
                    <select
                      value={postArtworkId}
                      onChange={(e) => setPostArtworkId(e.target.value)}
                      className="w-full p-3 border border-border-color focus:border-accent-gold outline-none text-xs rounded-none bg-bg-canvas font-sans text-text-main font-semibold"
                    >
                      <option value="">{t("No artwork")}</option>
                      {ARTWORKS.map(art => {
                        const translated = translateArtwork(art);
                        return (
                          <option key={translated.id} value={translated.id}>
                            {translated.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Itinerary */}
                  <div className="space-y-1.5">
                    <label className="block font-black uppercase tracking-wider text-text-light font-sans">
                      {t("Link an Itinerary (Optional)")}
                    </label>
                    <select
                      value={postItineraryId}
                      onChange={(e) => setPostItineraryId(e.target.value)}
                      className="w-full p-3 border border-border-color focus:border-accent-gold outline-none text-xs rounded-none bg-bg-canvas font-sans text-text-main font-semibold"
                    >
                      <option value="">{t("No itinerary")}</option>
                      {ITINERARIES.map(itin => {
                        const translated = translateItinerary(itin);
                        return (
                          <option key={translated.id} value={translated.id}>
                            {translated.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                </div>

                {/* Body */}
                <div className="space-y-1.5 font-sans">
                  <label className="block font-black uppercase tracking-wider text-text-light font-sans">
                    {t("Message Body")} <span className="text-[#A41034]">*</span>
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder={t("Describe your experience, ask your question, or write your report in detail...")}
                    className="w-full p-3 border border-border-color focus:border-accent-gold outline-none text-xs rounded-none bg-bg-canvas font-sans text-text-main resize-y leading-relaxed"
                  />
                </div>

                {/* Bottom row actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-color/60">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPost(false)}
                    className="px-6 py-2.5 border border-border-color text-text-light hover:bg-bg-canvas transition-colors uppercase tracking-widest text-[9.5px] font-bold cursor-pointer"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-6 py-2.5 bg-sidebar-bg text-accent-gold hover:bg-black transition-colors uppercase tracking-widest text-[9.5px] font-black cursor-pointer flex items-center gap-2 "
                  >
                    {createLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        {t("Submitting...")}
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        {t("Publish Post")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : selectedPostId ? (
          
          /* VIEW B: POST DETAILS & REPLIES */
          <div className="flex-grow overflow-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
            {selectedPost ? (
              <div className="space-y-6">
                
                {/* Back button link */}
                <div>
                  <button
                    onClick={() => setSelectedPostId(null)}
                    className="flex items-center gap-1.5 text-text-light hover:text-accent-gold text-[10px] uppercase tracking-widest font-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> {t("Back to list")}
                  </button>
                </div>

                {/* Primary Post Detail Card */}
                <div className="bg-white border border-border-color p-6 md:p-8 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold text-[10px] uppercase tracking-widest font-black">
                      {getCategoryLabel(selectedPost.category)}
                    </span>
                    <span className="text-[10px] font-mono text-text-light">
                      {new Date(selectedPost.created_at).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  <h3 className="font-serif italic text-2xl md:text-3xl text-sidebar-bg font-bold mb-4 leading-tight">
                    {selectedPost.title}
                  </h3>

                  {/* Author Row */}
                  <div className="flex items-center justify-between border-b border-border-color/50 pb-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sidebar-bg/5 flex items-center justify-center text-sm font-serif italic font-bold text-accent-gold uppercase border border-accent-gold/20">
                        {(selectedPost.profiles?.first_name || "C").charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-extrabold text-sidebar-bg">
                          {selectedPost.profiles 
                            ? `${selectedPost.profiles.first_name || ""} ${selectedPost.profiles.last_name || ""}`.trim() 
                            : "Contributor"}
                        </p>
                        <p className="text-[9px] text-text-light font-mono">{t("Post Author")}</p>
                      </div>
                    </div>

                    {user && selectedPost.user_id === user.id && (
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="text-xs text-[#A41034] border border-[#A41034]/20 hover:border-[#A41034] px-3 py-1.5 transition-all text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> {t("Delete post")}
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="text-sm text-text-main font-light leading-relaxed whitespace-pre-wrap break-words pb-6">
                    {selectedPost.body}
                  </div>

                  {/* Associated Content Connections */}
                  {(selectedPost.artwork_id || selectedPost.itinerary_id) && (
                    <div className="border-t border-border-color pt-5 mt-4 flex flex-col sm:flex-row gap-3">
                      {selectedPost.artwork_id && (
                        <div className="bg-bg-canvas border border-border-color/60 px-4 py-3 flex-1 flex flex-col justify-between gap-1.5">
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-text-light font-black block">{t("LINKED ARTWORK")}</span>
                            <span className="text-xs font-serif italic text-sidebar-bg font-extrabold mt-0.5 block">{getArtworkName(selectedPost.artwork_id)}</span>
                          </div>
                          <button
                            onClick={() => onSelectArtworkById(selectedPost.artwork_id)}
                            className="text-[9px] uppercase tracking-wider font-extrabold text-accent-gold hover:text-black transition-colors self-start flex items-center gap-1 cursor-pointer mt-1"
                          >
                            <ExternalLink size={11} /> {t("View Artwork")}
                          </button>
                        </div>
                      )}

                      {selectedPost.itinerary_id && (
                        <div className="bg-bg-canvas border border-border-color/60 px-4 py-3 flex-1 flex flex-col justify-between gap-1.5">
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-text-light font-black block">{t("LINKED ITINERARY")}</span>
                            <span className="text-xs font-serif italic text-sidebar-bg font-extrabold mt-0.5 block">{getItineraryName(selectedPost.itinerary_id)}</span>
                          </div>
                          <button
                            onClick={onNavigateToItineraries}
                            className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 hover:text-emerald-800 transition-colors self-start flex items-center gap-1 cursor-pointer mt-1"
                          >
                            <ExternalLink size={11} /> {t("Go to itineraries")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Replies Area Title */}
                <div className="pt-2">
                  <h4 className="text-[11px] uppercase tracking-[3px] font-black text-text-light/80 mb-4 flex items-center gap-2">
                    <MessageCircle size={15} className="text-accent-gold" />
                    {t("Replies")} ({replies.length})
                  </h4>
                  
                  {/* Replies List */}
                  {replies.length > 0 ? (
                    <div className="space-y-3">
                      {replies.map((reply) => {
                        const replierName = reply.profiles 
                          ? `${reply.profiles.first_name || ""} ${reply.profiles.last_name || ""}`.trim() 
                          : "Contributor";
                        
                        return (
                          <div 
                            key={reply.id}
                            className="bg-white border border-border-color p-4 shadow-sm relative group"
                          >
                            <div className="flex items-center justify-between border-b border-border-color/30 pb-2 mb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-sidebar-bg/5 flex items-center justify-center text-[10px] font-serif italic font-bold text-accent-gold">
                                  {replierName.charAt(0)}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-sidebar-bg">
                                  {replierName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span className="text-[9px] font-mono text-text-light/60">
                                  {new Date(reply.created_at).toLocaleString("en-US", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>                                 {user && reply.user_id === user.id && (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="p-1 text-text-light hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
                                    title={t("Delete")}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-text-main font-light leading-relaxed whitespace-pre-wrap break-words">
                              {reply.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-border-color p-6 text-center text-xs text-text-light/50 font-light italic">
                      {t("No replies to this post yet. Be the first to reply!")}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="bg-white border border-border-color p-5 shadow-sm">
                  {user ? (
                    <form onSubmit={handleAddReply} className="space-y-3.5">
                      <label className="block text-[10px] uppercase tracking-wider font-black text-text-light">
                        {t("Add a reply")}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder={t("Leave a comment or provide feedback on this post...")}
                        className="w-full text-xs p-3 border border-border-color focus:border-accent-gold outline-none rounded-none bg-bg-canvas text-text-main"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replyLoading || !replyBody.trim()}
                          className="px-5 py-2 bg-sidebar-bg text-accent-gold hover:bg-black uppercase tracking-widest text-[9.5px] font-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {replyLoading ? t("Submitting...") : t("Reply")} <Send size={12} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-text-light mb-3">
                        {t("Sign in to reply and participate in the discussion.")}
                      </p>
                      <button
                        onClick={onTriggerLogin}
                        className="px-4 py-2 bg-sidebar-bg text-accent-gold hover:bg-black text-[9px] uppercase tracking-widest font-black transition-all border border-accent-gold cursor-pointer"
                      >
                        {t("Sign in now")}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
              </div>
            )}
          </div>
        ) : (
          
          /* VIEW C: ALL POSTS LIST & FILTERBAR */
          <div className="flex-grow flex flex-col overflow-hidden min-h-0 min-w-0">
            {/* Filter Category Tabs */}
            <div className="bg-white border-b border-border-color px-6 md:px-8 py-3 w-full shrink-0 flex items-center justify-between gap-4 overflow-x-auto select-none no-scrollbar shadow-sm">
              <div className="flex gap-2 items-center">
                <Tag size={13} className="text-accent-gold shrink-0 mr-1" />
                {(["Tutti", "Esperienze", "Consigli", "Segnalazioni", "Domande"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border shrink-0 cursor-pointer ${
                      activeCategory === cat
                        ? "bg-accent-gold border-accent-gold text-white shadow"
                        : "bg-white border-border-color text-text-light hover:border-accent-gold/40 hover:text-accent-gold"
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              <div className="text-[10px] tracking-wide text-text-light/50 font-mono hidden md:block">
                {t("Found:")} {filteredPosts.length} {filteredPosts.length === 1 ? t('post') : t('posts')}
              </div>
            </div>

            {/* Posts Grid List */}
            <div className="flex-grow overflow-auto p-2 ">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-accent-gold" />
                  <p className="text-xs text-text-light/70 font-mono uppercase tracking-widest">{t("Loading board...")}</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {filteredPosts.map(renderPostCard)}
                </div>
              ) : (
                <div className="max-w-md mx-auto bg-white border border-border-color p-8 mt-12 text-center shadow-sm">
                  <p className="font-serif italic text-lg text-sidebar-bg font-bold mb-2">
                    {t("No posts found")}
                  </p>
                  <p className="text-xs text-text-light leading-relaxed mb-6 font-light">
                    {activeCategory === "Tutti" 
                      ? t("The community board is currently empty. Would you like to publish the first post?")
                      : t("No posts in the category") + ` "${getCategoryLabel(activeCategory)}".`}
                  </p>
                  <button
                    onClick={() => {
                      if (!user) onTriggerLogin();
                      else setIsCreatingPost(true);
                    }}
                    className="px-5 py-2.5 bg-accent-gold text-sidebar-bg uppercase tracking-widest text-[9.5px] font-black transition-all hover:scale-105 cursor-pointer"
                  >
                    {t("Publish now")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
