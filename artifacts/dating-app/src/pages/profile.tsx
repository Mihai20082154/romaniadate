import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Camera, Plus, Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ROMANIAN_CITIES } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setCity(user.city);
      setPhotos(user.photos || []);
      setInterests(user.interests || []);
    }
  }, [user]);

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newInterest.trim() && interests.length < 10) {
      e.preventDefault();
      if (!interests.includes(newInterest.trim().toLowerCase())) {
        setInterests([...interests, newInterest.trim().toLowerCase()]);
      }
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        data: { name, bio, city, photos, interests }
      });
      toast({ title: "Profile updated!" });
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.error, variant: "destructive" });
    }
  };

  // Mock photo upload handler
  const handleAddPhoto = () => {
    if (photos.length >= 6) return;
    const mockNewPhoto = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=800&fit=crop";
    setPhotos([...photos, mockNewPhoto]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Edit Profile</h1>
        <button 
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-full font-bold transition-colors"
        >
          {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {/* Photos Grid */}
      <GlassCard variant="panel">
        <h3 className="font-bold mb-4">Photos ({photos.length}/6)</h3>
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="aspect-[3/4] relative rounded-xl overflow-hidden group">
              <img src={photo} className="w-full h-full object-cover" alt="" />
              <button 
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button 
              onClick={handleAddPhoto}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-muted-foreground transition-colors"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
      </GlassCard>

      <GlassCard variant="panel" className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 px-1">Name</label>
          <input 
            value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 px-1">City</label>
          <select 
            value={city} onChange={e => setCity(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            {ROMANIAN_CITIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 px-1">Bio</label>
          <textarea 
            value={bio} onChange={e => setBio(e.target.value)}
            rows={4}
            placeholder="Tell them about yourself..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      </GlassCard>

      <GlassCard variant="panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Interests</h3>
          <span className="text-xs text-muted-foreground">{interests.length}/10</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {interests.map(interest => (
            <span key={interest} className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium flex items-center gap-1">
              {interest}
              <button onClick={() => removeInterest(interest)}><X className="w-3 h-3 hover:text-white" /></button>
            </span>
          ))}
        </div>

        {interests.length < 10 && (
          <div className="relative">
            <input 
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              onKeyDown={handleAddInterest}
              placeholder="Type and press enter..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
            <button 
              onClick={() => handleAddInterest({ key: 'Enter', preventDefault: ()=>{} } as any)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
