import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../utils/constants";

interface ProviderSettings {
  apiProvider?: string;
  apiKey?: string;
  apiModelId?: string;
  modelTemperature?: number;
  modelMaxTokens?: number;
  reasoningEffort?: "low" | "medium" | "high";
  includeMaxTokens?: boolean;
  diffEnabled?: boolean;
  rateLimitSeconds?: number;
}

interface Profile {
  id: string;
  name: string;
  apiProvider?: string;
}

interface ProfileDetails {
  id: string;
  name: string;
  profile: ProviderSettings;
  isActive: boolean;
}

interface ProfileManagerProps {
  currentProfile?: string;
  onProfileChange: (profileId: string) => void;
  extensionId?: string;
  className?: string;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentProfile,
  onProfileChange,
  extensionId,
  className = "",
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = extensionId 
        ? `${API_ENDPOINTS.INFO.replace('/info', '/roo/profiles')}?extensionId=${extensionId}`
        : API_ENDPOINTS.INFO.replace('/info', '/roo/profiles');
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }

      const data = await response.json();
      setProfiles(data.profiles || []);
      setActiveProfile(data.activeProfile);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profiles");
    } finally {
      setIsLoading(false);
    }
  }, [extensionId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = useCallback(async (name: string, profile: ProviderSettings) => {
    try {
      setIsCreating(true);
      const response = await fetch(API_ENDPOINTS.INFO.replace('/info', '/roo/profiles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          profile,
          activate: true,
          extensionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create profile: ${response.statusText}`);
      }

      const result = await response.json();
      await fetchProfiles();
      setShowCreateForm(false);
      
      if (result.id) {
        onProfileChange(result.id);
      }
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setIsCreating(false);
    }
  }, [extensionId, fetchProfiles, onProfileChange]);

  const deleteProfile = useCallback(async (profileName: string) => {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      return;
    }

    try {
      const url = extensionId
        ? `${API_ENDPOINTS.INFO.replace('/info', `/roo/profiles/${encodeURIComponent(profileName)}`)}?extensionId=${extensionId}`
        : API_ENDPOINTS.INFO.replace('/info', `/roo/profiles/${encodeURIComponent(profileName)}`);
        
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to delete profile: ${response.statusText}`);
      }

      await fetchProfiles();
    } catch (err) {
      console.error("Error deleting profile:", err);
      setError(err instanceof Error ? err.message : "Failed to delete profile");
    }
  }, [extensionId, fetchProfiles]);

  const setActiveProfileHandler = useCallback(async (profileName: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.INFO.replace('/info', `/roo/profiles/active/${encodeURIComponent(profileName)}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extensionId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to set active profile: ${response.statusText}`);
      }

      await fetchProfiles();
      onProfileChange(profileName);
    } catch (err) {
      console.error("Error setting active profile:", err);
      setError(err instanceof Error ? err.message : "Failed to set active profile");
    }
  }, [extensionId, fetchProfiles, onProfileChange]);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profiles</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Profile
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-3 border rounded-lg transition-colors ${
              profile.id === activeProfile?.id
                ? "border-blue-500 bg-blue-50 md:bg-blue-500/20"
                : "border-gray-200 md:border-white/20 hover:border-gray-300 md:hover:border-white/30 bg-white/50 md:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{profile.name}</h4>
                  {profile.id === activeProfile?.id && (
                    <span className="px-2 py-1 bg-blue-100 md:bg-blue-500 text-blue-800 md:text-white text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                {profile.apiProvider && (
                  <p className="text-sm opacity-75">{profile.apiProvider}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {profile.id !== activeProfile?.id && (
                  <button
                    onClick={() => setActiveProfileHandler(profile.name)}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => deleteProfile(profile.name)}
                  disabled={profile.id === activeProfile?.id}
                  className="px-2 py-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="text-center py-8 opacity-75">
            <p>No profiles configured</p>
            <p className="text-sm">Create your first profile to get started</p>
          </div>
        )}
      </div>

      {showCreateForm && (
        <CreateProfileForm
          onSubmit={createProfile}
          onCancel={() => setShowCreateForm(false)}
          isCreating={isCreating}
        />
      )}
    </div>
  );
};

interface CreateProfileFormProps {
  onSubmit: (name: string, profile: ProviderSettings) => void;
  onCancel: () => void;
  isCreating: boolean;
}

const CreateProfileForm: React.FC<CreateProfileFormProps> = ({
  onSubmit,
  onCancel,
  isCreating,
}) => {
  const [name, setName] = useState("");
  const [apiProvider, setApiProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [apiModelId, setApiModelId] = useState("");
  const [modelTemperature, setModelTemperature] = useState(0.7);
  const [modelMaxTokens, setModelMaxTokens] = useState(4096);

  const providers = [
    { value: "anthropic", label: "Anthropic Claude" },
    { value: "openai", label: "OpenAI" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "ollama", label: "Ollama" },
    { value: "gemini", label: "Google Gemini" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit(name.trim(), {
      apiProvider,
      apiKey: apiKey.trim() || undefined,
      apiModelId: apiModelId.trim() || undefined,
      modelTemperature,
      modelMaxTokens,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create Profile</h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Development Profile"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Provider
            </label>
            <select
              value={apiProvider}
              onChange={(e) => setApiProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model ID
            </label>
            <input
              type="text"
              value={apiModelId}
              onChange={(e) => setApiModelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="claude-3-sonnet-20240229"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature: {modelTemperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelTemperature}
              onChange={(e) => setModelTemperature(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              value={modelMaxTokens}
              onChange={(e) => setModelMaxTokens(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="200000"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};