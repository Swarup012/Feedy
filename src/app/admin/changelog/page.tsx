"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Bold,
  Italic,
  Code,
  ListOrdered,
  List,
  Link,
  Image,
  Sparkles,
  Wrench,
  CheckCircle2,
  X,
  Edit,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/context/OrganizationContext";
import { changelogService, Changelog } from "@/services/changelogService";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";

const TYPE_CONFIG = {
  new: {
    label: "New",
    icon: Sparkles,
    className: "clog__type--new",
  },
  improved: {
    label: "Improved",
    icon: Wrench,
    className: "clog__type--improved",
  },
  fixed: {
    label: "Fixed",
    icon: CheckCircle2,
    className: "clog__type--fixed",
  },
};

export default function ChangelogPage() {
  const { toast } = useToast();
  const { organizationRole } = useOrganization();
  // Writes are owner/admin only on the backend — hide create/edit/delete entry points.
  const canManage = ["owner", "admin"].includes(organizationRole ?? "");
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [filteredChangelogs, setFilteredChangelogs] = useState<Changelog[]>([]);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState({
    new: true,
    improved: true,
    fixed: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "new" as "new" | "improved" | "fixed",
    status: "draft" as "draft" | "published",
    labels: [] as string[],
  });
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    fetchChangelogs();
  }, []);

  useEffect(() => {
    let filtered = [...changelogs];

    if (searchQuery) {
      filtered = filtered.filter((changelog) =>
        changelog.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.filter((changelog) => {
      if (changelog.type === "new") return filterType.new;
      if (changelog.type === "improved") return filterType.improved;
      if (changelog.type === "fixed") return filterType.fixed;
      return false;
    });

    setFilteredChangelogs(filtered);
  }, [changelogs, searchQuery, filterType]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await changelogService.getAllChangelogs();
      if (response && response.data && Array.isArray(response.data.changelogs)) {
        setChangelogs(response.data.changelogs);
      } else {
        setChangelogs([]);
      }
    } catch (error: any) {
      setChangelogs([]);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to load changelogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedChangelog(null);
    setIsEditorOpen(true);
    setFormData({
      title: "",
      content: "",
      type: "new",
      status: "draft",
      labels: [],
    });
  };

  const handleEditChangelog = (changelog: Changelog) => {
    setIsCreating(false);
    setSelectedChangelog(changelog);
    setIsEditorOpen(true);
    setFormData({
      title: changelog.title,
      content: changelog.content,
      type: changelog.type,
      status: changelog.status,
      labels: changelog.labels || [],
    });
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: "Validation Error",
          description: "Title and content are required",
          variant: "destructive",
        });
        return;
      }

      if (selectedChangelog) {
        await changelogService.updateChangelog(selectedChangelog.id, formData);
        toast({
          title: "Success",
          description: "Changelog updated successfully",
        });
      } else {
        const response = await changelogService.createChangelog(formData);
        toast({
          title: "Success",
          description: "Changelog created successfully",
        });
        setSelectedChangelog(response.data.changelog);
      }

      setIsCreating(false);
      setIsEditorOpen(false);
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save changelog",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedChangelog) return;
    if (!confirm("Are you sure you want to delete this changelog?")) return;

    try {
      await changelogService.deleteChangelog(selectedChangelog.id);
      toast({
        title: "Success",
        description: "Changelog deleted successfully",
      });
      setSelectedChangelog(null);
      setIsCreating(false);
      setIsEditorOpen(false);
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete changelog",
        variant: "destructive",
      });
    }
  };

  const addLabel = () => {
    if (newLabel && !formData.labels.includes(newLabel)) {
      setFormData({
        ...formData,
        labels: [...formData.labels, newLabel],
      });
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter((l) => l !== label),
    });
  };

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText =
      formData.content.substring(0, start) +
      before +
      selectedText +
      after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleCode = () => insertMarkdown("`", "`");
  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) insertMarkdown("[", `](${url})`);
  };
  const handleList = () => insertMarkdown("\n- ", "");
  const handleOrderedList = () => insertMarkdown("\n1. ", "");

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image",
      });

      try {
        const { uploadService } = await import("@/services/uploadService");
        const imageUrl = await uploadService.uploadImage(file, "changelog");
        insertMarkdown(`\n![Image](${imageUrl})\n`, "");
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to upload image",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const typeCounts = {
    new: changelogs.filter((changelog) => changelog.type === "new").length,
    improved: changelogs.filter((changelog) => changelog.type === "improved").length,
    fixed: changelogs.filter((changelog) => changelog.type === "fixed").length,
  };
  const allFiltersOn = filterType.new && filterType.improved && filterType.fixed;
  const isNarrowed = Boolean(searchQuery) || !allFiltersOn;

  // Group changelogs by date
  const groupedChangelogs = filteredChangelogs.reduce((acc, changelog) => {
    const date = changelog.published_at
      ? format(parseISO(changelog.published_at), "MMMM yyyy")
      : "Draft";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(changelog);
    return acc;
  }, {} as Record<string, Changelog[]>);

  const dateGroups = Object.entries(groupedChangelogs);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="clog">
        {/* Masthead */}
        <header className="clog__masthead">
          <div className="clog__headline">
            <h1 className="clog__title">Changelog</h1>
            <p className="clog__lede">
              New features, improvements, and fixes. Follow our journey as we build
              better tools for your team.
            </p>
          </div>

          <aside className="clog__register" aria-label="Release register">
            <div className="clog__register-total">
              <span className="clog__register-number">{changelogs.length}</span>
              <span className="clog__register-label">
                {changelogs.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="clog__register-bar" aria-hidden="true">
              {typeCounts.new > 0 && (
                <span
                  className="clog__register-seg clog__register-seg--new"
                  style={{ flexGrow: typeCounts.new }}
                />
              )}
              {typeCounts.improved > 0 && (
                <span
                  className="clog__register-seg clog__register-seg--improved"
                  style={{ flexGrow: typeCounts.improved }}
                />
              )}
              {typeCounts.fixed > 0 && (
                <span
                  className="clog__register-seg clog__register-seg--fixed"
                  style={{ flexGrow: typeCounts.fixed }}
                />
              )}
            </div>
            <ul className="clog__register-key">
              <li>
                <span className="clog__key clog__key--new" aria-hidden="true" />
                New <span className="clog__key-value">{typeCounts.new}</span>
              </li>
              <li>
                <span className="clog__key clog__key--improved" aria-hidden="true" />
                Improved <span className="clog__key-value">{typeCounts.improved}</span>
              </li>
              <li>
                <span className="clog__key clog__key--fixed" aria-hidden="true" />
                Fixed <span className="clog__key-value">{typeCounts.fixed}</span>
              </li>
            </ul>
          </aside>
        </header>

        {/* Toolbar */}
        <div className="clog__toolbar">
          <div className="clog__search">
            <Search aria-hidden="true" />
            <input
              type="search"
              className="clog__input"
              placeholder="Search updates..."
              aria-label="Search updates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="clog__tools">
            <button
              type="button"
              className="btn"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="changelog-filters"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filter
            </button>
            {canManage && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Entry
              </button>
            )}
          </div>
        </div>

        {/* Type Filters */}
        {showFilters && (
          <div className="clog__filters" id="changelog-filters" role="group" aria-label="Filter by type">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = filterType[key as keyof typeof filterType];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setFilterType({
                      ...filterType,
                      [key]: !isActive,
                    })
                  }
                  className="clog__filter"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{config.label}</span>
                  <span className="clog__filter-count">
                    {typeCounts[key as keyof typeof typeCounts]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isNarrowed && !loading && (
          <p className="clog__result" role="status">
            {filteredChangelogs.length} of {changelogs.length} entries shown
          </p>
        )}

        {/* Timeline Content */}
        {loading ? (
          <div className="clog__state" aria-live="polite">
            <span className="clog__spinner" aria-hidden="true" />
            <p className="clog__state-note">Loading changelog…</p>
          </div>
        ) : filteredChangelogs.length === 0 ? (
          <div className="clog__state">
            <span className="clog__state-icon">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="clog__state-title">No updates yet</h2>
            <p className="clog__state-note">
              Start documenting your product journey by creating your first changelog entry.
            </p>
            {canManage && (
              <button type="button" className="btn btn--primary" onClick={handleCreateNew}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="clog__stream">
            {dateGroups.map(([date, logs]) => (
              <section className="clog__month" key={date}>
                <div className="clog__month-head">
                  <h2 className="clog__month-label">{date}</h2>
                  <span className="clog__month-count">
                    {logs.length} {logs.length === 1 ? "entry" : "entries"}
                  </span>
                </div>

                <div className="clog__entries">
                  {logs.map((changelog) => {
                    const config = TYPE_CONFIG[changelog.type];
                    const Icon = config.icon;

                    return (
                      <article className="clog__entry" key={changelog.id}>
                        <div className="clog__entry-meta">
                          <span className={`clog__type ${config.className}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {config.label}
                          </span>
                          {changelog.status === "draft" && (
                            <span className="clog__draft">Draft</span>
                          )}
                          <time
                            className="clog__date"
                            dateTime={changelog.published_at || undefined}
                          >
                            {changelog.published_at
                              ? formatDistanceToNow(new Date(changelog.published_at), {
                                  addSuffix: true,
                                })
                              : "Not published"}
                          </time>

                          {canManage && (
                            <button
                              type="button"
                              className="clog__edit"
                              onClick={() => handleEditChangelog(changelog)}
                              aria-label={`Edit ${changelog.title}`}
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        <h3 className="clog__entry-title">{changelog.title}</h3>

                        <div className="clog__prose prose-blog">
                          <ReactMarkdown
                            components={{
                              img: ({ node, ...props }) => (
                                <img
                                  {...props}
                                  className="clog__prose-image"
                                  style={{ maxWidth: "100%" }}
                                />
                              ),
                            }}
                          >
                            {changelog.content}
                          </ReactMarkdown>
                        </div>

                        {changelog.labels && changelog.labels.length > 0 && (
                          <ul className="clog__labels">
                            {changelog.labels.map((label, idx) => (
                              <li className="clog__label" key={idx}>
                                {label}
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Editor Panel */}
      {isEditorOpen && (
        <div
          className="clog-editor"
          role="dialog"
          aria-modal="true"
          aria-label={isCreating ? "New entry" : "Edit entry"}
        >
          <div className="clog-editor__head">
            <div className="clog-editor__headline">
              <button
                type="button"
                className="clog-tool"
                onClick={handleCloseEditor}
                aria-label="Close editor"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <h2 className="clog-editor__title">
                {isCreating ? "New Entry" : "Edit Entry"}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!formData.title || !formData.content}
            >
              {formData.status === "published" ? "Publish" : "Save Draft"}
            </button>
          </div>

          <div className="clog-editor__body">
            <div className="clog-field">
              <label className="clog-field__label" htmlFor="changelog-title">
                Title
              </label>
              <input
                id="changelog-title"
                className="clog-input"
                placeholder="What's new?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="clog-field">
              <span className="clog-field__label">Type</span>
              <div className="clog-types">
                {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setFormData({ ...formData, type: key as any })}
                      className="clog-type-option"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="clog-field">
              <label className="clog-field__label" htmlFor="changelog-content">
                Content
              </label>
              <div className="clog-editor__content">
                <div className="clog-editor__toolbar" role="toolbar" aria-label="Formatting">
                  <button type="button" className="clog-tool" onClick={handleBold} aria-label="Bold">
                    <Bold className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" className="clog-tool" onClick={handleItalic} aria-label="Italic">
                    <Italic className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" className="clog-tool" onClick={handleCode} aria-label="Code">
                    <Code className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" className="clog-tool" onClick={handleLink} aria-label="Link">
                    <Link className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="clog-tool--sep" aria-hidden="true" />
                  <button type="button" className="clog-tool" onClick={handleList} aria-label="Bullet list">
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="clog-tool"
                    onClick={handleOrderedList}
                    aria-label="Numbered list"
                  >
                    <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="clog-tool--sep" aria-hidden="true" />
                  <button
                    type="button"
                    className="clog-tool"
                    onClick={handleImageUpload}
                    aria-label="Upload image"
                  >
                    <Image className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  id="changelog-content"
                  ref={textareaRef}
                  className="clog-textarea"
                  placeholder="Describe the update in detail..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                />
              </div>
              <p className="clog-field__hint">
                Markdown supported.{" "}
                <kbd className="clog-kbd">Ctrl+B</kbd> bold,{" "}
                <kbd className="clog-kbd">Ctrl+I</kbd> italic
              </p>
            </div>

            <div className="clog-field">
              <label className="clog-field__label" htmlFor="changelog-label">
                Labels (optional)
              </label>
              <input
                id="changelog-label"
                className="clog-input"
                placeholder="Add label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
              />
              <div className="clog-labels-edit">
                {formData.labels.map((label, idx) => (
                  <span className="clog-chip" key={idx}>
                    {label}
                    <button
                      type="button"
                      className="clog-chip__remove"
                      onClick={() => removeLabel(label)}
                      aria-label={`Remove ${label}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="clog-editor__status">
              <span className="clog-field__label">Status</span>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setFormData({
                    ...formData,
                    status: formData.status === "published" ? "draft" : "published",
                  })
                }
              >
                {formData.status === "published" ? "Published" : "Draft"}
              </button>
            </div>

            {selectedChangelog && (
              <button type="button" className="btn clog-delete" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete Entry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
