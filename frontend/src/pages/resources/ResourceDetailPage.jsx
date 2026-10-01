import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource } from '../../services/resourceService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  DocumentIcon,
  PlayIcon,
  BookOpenIcon,
  EditIcon,
  ClockIcon,
  CheckCircleIcon,
} from '../../components/ui/Icons.jsx';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getResource(id);
        if (!data) {
          setError('Study material not found or is currently unavailable.');
        } else {
          setResource(data);
        }
      } catch (err) {
        console.error('Failed to load resource details:', err);
        setError(err.response?.data?.message || 'Failed to load study resource.');
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading study material details..." />;
  }

  if (error || !resource) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState
          title="Resource Not Found"
          message={error || 'This study material is unavailable.'}
          onRetry={() => navigate('/resources')}
        />
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Study Materials', href: '/resources' },
    { label: resource.title },
  ];

  const getFormatBadge = (formatType) => {
    const norm = (formatType || '').toLowerCase();
    switch (norm) {
      case 'pdf':
        return (
          <Badge variant="danger">
            <DocumentIcon className="w-3.5 h-3.5 mr-1 inline" /> PDF Document
          </Badge>
        );
      case 'video':
        return (
          <Badge variant="info">
            <PlayIcon className="w-3.5 h-3.5 mr-1 inline" /> Video Tutorial
          </Badge>
        );
      case 'article':
        return (
          <Badge variant="primary">
            <BookOpenIcon className="w-3.5 h-3.5 mr-1 inline" /> Article Guide
          </Badge>
        );
      case 'note':
        return (
          <Badge variant="warning">
            <EditIcon className="w-3.5 h-3.5 mr-1 inline" /> Revision Notes
          </Badge>
        );
      case 'link':
      default:
        return (
          <Badge variant="default">
            <ExternalLinkIcon className="w-3.5 h-3.5 mr-1 inline" /> External Link
          </Badge>
        );
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
        onClick={() => navigate('/resources')}
      >
        All Materials
      </Button>

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            variant="primary"
            size="sm"
            iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
          >
            Open Resource
          </Button>
        </a>
      )}
    </div>
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Top Banner / Header */}
      <PageHeader
        title={resource.title}
        description={resource.description || 'Comprehensive placement preparation study material.'}
        breadcrumbs={breadcrumbs}
        badge={getFormatBadge(resource.type)}
        actions={headerActions}
      />

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base sm:text-lg">
                Overview & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {resource.description || 'No detailed overview provided for this study resource.'}
              </p>
            </CardContent>
          </Card>

          {/* Access / Preview Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg">
                Study Material Access
              </CardTitle>
              {resource.url && (
                <span className="text-xs text-slate-500 font-medium">
                  Verified Destination
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {resource.url ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Resource Location
                        </span>
                        <Badge variant="outline" size="sm">
                          {resource.type?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate max-w-lg">
                        {resource.url}
                      </p>
                    </div>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-full sm:w-auto"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                        className="w-full sm:w-auto"
                      >
                        Launch Material
                      </Button>
                    </a>
                  </div>

                  {/* Embedded PDF Preview if format is PDF */}
                  {resource.type?.toLowerCase() === 'pdf' && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Document Viewer
                      </h4>
                      <iframe
                        src={resource.url}
                        title={resource.title}
                        className="w-full h-[600px] rounded-xl border border-slate-200 shadow-2xs bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No direct URL or document file has been provided for this resource yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel (Right 1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Resource Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Category
                </span>
                <span className="text-sm font-medium text-slate-800 block">
                  {resource.category || 'General Preparation'}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Topic Focus
                </span>
                <span className="text-sm font-medium text-slate-800 block">
                  {resource.topic || 'Curated'}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Material Format
                </span>
                <span className="text-sm font-medium text-slate-800 uppercase block font-mono">
                  {resource.type || 'Standard'}
                </span>
              </div>

              {resource.createdAt && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Added to Repository
                  </span>
                  <span className="text-xs text-slate-600 block font-mono">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Practice Shortcuts */}
          <Card className="bg-slate-900 border-slate-900 text-white shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Put Knowledge into Practice
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Solidify concepts learned in this material by testing your skills on live challenges.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/aptitude')}
                  className="justify-center"
                >
                  Practice Aptitude
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/coding')}
                  className="justify-center bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                >
                  Solve Coding Problems
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/mock-tests')}
                  className="justify-center bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Take Full Mock Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
