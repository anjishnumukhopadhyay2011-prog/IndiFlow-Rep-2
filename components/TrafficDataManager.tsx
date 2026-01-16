/**
 * Traffic Data Manager Component for Developer Mode
 *
 * Features:
 * - Upload local traffic data files (CSV, JSON, TXT, etc.)
 * - Use free LLM to parse and analyze traffic data
 * - View and manage uploaded traffic datasets
 * - Run LLM analysis on route traffic data
 */

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  Trash2,
  Brain,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  Database,
  RefreshCw,
  Eye,
  Download,
  Search,
  FileUp,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUnstructuredTrainingData, analyzeTrafficPatterns } from "@/lib/llm-service";

// Types
interface TrafficDataFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  rawContent: string;
  parsedData: TrafficDataRecord[];
  llmProcessed: boolean;
  analysisNotes?: string;
}

interface TrafficDataRecord {
  id: string;
  route: string;
  predictedTime: number;
  actualTime: number;
  trafficLevel: string;
  timestamp: Date;
  accuracy: number;
  source: string; // Which file this came from
}

interface TrafficAnalysisResult {
  insights: string[];
  patterns: string[];
  recommendations: string[];
  timestamp: Date;
}

// Storage keys
const TRAFFIC_FILES_STORAGE_KEY = 'indiflow_dev_traffic_files';
const TRAFFIC_ANALYSIS_STORAGE_KEY = 'indiflow_dev_traffic_analysis';

// Load/save helpers
function loadTrafficFiles(): TrafficDataFile[] {
  try {
    const stored = localStorage.getItem(TRAFFIC_FILES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((file: any) => ({
        ...file,
        uploadedAt: new Date(file.uploadedAt),
        parsedData: file.parsedData.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        })),
      }));
    }
  } catch (error) {
    console.error('Failed to load traffic files:', error);
  }
  return [];
}

function saveTrafficFiles(files: TrafficDataFile[]): void {
  try {
    localStorage.setItem(TRAFFIC_FILES_STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Failed to save traffic files:', error);
  }
}

function loadTrafficAnalysis(): TrafficAnalysisResult | null {
  try {
    const stored = localStorage.getItem(TRAFFIC_ANALYSIS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      };
    }
  } catch (error) {
    console.error('Failed to load traffic analysis:', error);
  }
  return null;
}

function saveTrafficAnalysis(analysis: TrafficAnalysisResult): void {
  try {
    localStorage.setItem(TRAFFIC_ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
  } catch (error) {
    console.error('Failed to save traffic analysis:', error);
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// File Preview Component
function FilePreview({ file, onClose }: { file: TrafficDataFile; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">{file.fileName}</h4>
          <p className="text-xs text-slate-400">
            {formatFileSize(file.fileSize)} • {file.parsedData.length} records
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
          Close
        </Button>
      </div>

      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 max-h-40 overflow-auto">
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
          {file.rawContent.slice(0, 2000)}
          {file.rawContent.length > 2000 && '\n... (truncated)'}
        </pre>
      </div>

      {file.parsedData.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-slate-300 mb-2">Parsed Records</h5>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {file.parsedData.slice(0, 10).map((record) => (
                <div key={record.id} className="p-2 bg-slate-800/30 rounded text-xs flex justify-between">
                  <span className="text-blue-300">{record.route}</span>
                  <span className="text-slate-400">
                    Pred: {record.predictedTime}m, Actual: {record.actualTime}m
                  </span>
                </div>
              ))}
              {file.parsedData.length > 10 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  ... and {file.parsedData.length - 10} more records
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Main Component
interface TrafficDataManagerProps {
  onDataUpdate?: (totalRecords: number) => void;
}

export function TrafficDataManager({ onDataUpdate }: TrafficDataManagerProps) {
  const [files, setFiles] = useState<TrafficDataFile[]>(() => loadTrafficFiles());
  const [analysis, setAnalysis] = useState<TrafficAnalysisResult | null>(() => loadTrafficAnalysis());
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<TrafficDataFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all records from all files
  const allRecords = files.flatMap(f => f.parsedData);
  const totalRecords = allRecords.length;

  // Notify parent of data updates
  React.useEffect(() => {
    onDataUpdate?.(totalRecords);
  }, [totalRecords, onDataUpdate]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setLlmStatus(null);

    try {
      const content = await file.text();

      // Use LLM to parse the file
      setLlmStatus('AI is analyzing file structure...');

      const result = await parseUnstructuredTrainingData(content, file.name);

      if (!result.success || result.data.length === 0) {
        throw new Error(result.error || 'Failed to parse file. Ensure it contains traffic data.');
      }

      // Convert to our format
      const parsedData: TrafficDataRecord[] = result.data.map((item, idx) => ({
        id: `record_${Date.now()}_${idx}`,
        route: item.route,
        predictedTime: item.predictedTime,
        actualTime: item.actualTime,
        trafficLevel: item.trafficLevel,
        timestamp: new Date(),
        accuracy: Math.max(0, Math.min(100,
          100 - Math.abs((item.predictedTime - item.actualTime) / item.actualTime * 100)
        )),
        source: file.name,
      }));

      const newFile: TrafficDataFile = {
        id: `file_${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        rawContent: content,
        parsedData,
        llmProcessed: true,
        analysisNotes: `LLM extracted ${parsedData.length} records`,
      };

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      saveTrafficFiles(updatedFiles);

      setUploadSuccess(`AI extracted ${parsedData.length} traffic records from ${file.name}`);
      setLlmStatus(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      setLlmStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    saveTrafficFiles(updatedFiles);
    if (previewFile?.id === fileId) {
      setPreviewFile(null);
    }
  };

  // Run LLM analysis on all data
  const runLLMAnalysis = async () => {
    if (allRecords.length === 0) {
      setUploadError('No traffic data to analyze. Upload some files first.');
      return;
    }

    setIsAnalyzing(true);
    setLlmStatus('AI is analyzing traffic patterns...');

    try {
      const trainingData = allRecords.map(r => ({
        route: r.route,
        predictedTime: r.predictedTime,
        actualTime: r.actualTime,
        trafficLevel: r.trafficLevel,
      }));

      const result = await analyzeTrafficPatterns(trainingData);

      const newAnalysis: TrafficAnalysisResult = {
        ...result,
        timestamp: new Date(),
      };

      setAnalysis(newAnalysis);
      saveTrafficAnalysis(newAnalysis);
      setLlmStatus('Analysis complete!');

      setTimeout(() => setLlmStatus(null), 2000);
    } catch (error) {
      setUploadError('Failed to analyze traffic data');
      setLlmStatus(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear all data
  const clearAllData = () => {
    setFiles([]);
    setAnalysis(null);
    setPreviewFile(null);
    localStorage.removeItem(TRAFFIC_FILES_STORAGE_KEY);
    localStorage.removeItem(TRAFFIC_ANALYSIS_STORAGE_KEY);
  };

  // Filter files based on search
  const filteredFiles = files.filter(f =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.parsedData.some(r => r.route.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg border border-blue-700/50">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-blue-300">Files</span>
          </div>
          <div className="text-2xl font-bold text-white">{files.length}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg border border-purple-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-purple-300">Records</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalRecords}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg border border-green-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-300">Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {allRecords.length > 0
              ? `${(allRecords.reduce((s, r) => s + r.accuracy, 0) / allRecords.length).toFixed(1)}%`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
            <FileUp className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
            <FolderOpen className="h-3 w-3 mr-1" />
            Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          {/* Drop Zone */}
          <div
            className={cn(
              "p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
              isUploading
                ? "border-blue-500 bg-blue-900/20"
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
            )}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt,.log,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-3">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
                  <div className="text-sm text-blue-300">{llmStatus || 'Processing...'}</div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-blue-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-300">
                      Click to upload traffic data file
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      CSV, JSON, TXT, or Excel files
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <Alert className="bg-red-900/30 border-red-700">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm ml-2">{uploadError}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert className="bg-green-900/30 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm ml-2">{uploadSuccess}</AlertDescription>
            </Alert>
          )}

          {/* LLM Processing Info */}
          <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-white">AI-Powered Parsing</span>
            </div>
            <p className="text-xs text-slate-400">
              Our AI automatically interprets your file format and extracts traffic data.
              Supports structured (CSV, JSON) and unstructured (logs, text) files.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">CSV</Badge>
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">JSON</Badge>
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">TXT</Badge>
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">LOG</Badge>
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">Excel</Badge>
            </div>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="mt-4 space-y-4">
          {previewFile ? (
            <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files or routes..."
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* File List */}
              <ScrollArea className="h-64">
                {filteredFiles.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              <span className="font-medium text-white truncate">{file.fileName}</span>
                              {file.llmProcessed && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {formatFileSize(file.fileSize)} • {file.parsedData.length} records •
                              {file.uploadedAt.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewFile(file)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files uploaded yet</p>
                  </div>
                )}
              </ScrollArea>

              {/* Clear All Button */}
              {files.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllData}
                  className="w-full border-red-600/50 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear All Data
                </Button>
              )}
            </>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="mt-4 space-y-4">
          {/* Run Analysis Button */}
          <Button
            onClick={runLLMAnalysis}
            disabled={isAnalyzing || allRecords.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {llmStatus || 'Analyzing...'}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run AI Analysis on {totalRecords} Records
              </>
            )}
          </Button>

          {/* Analysis Results */}
          {analysis ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Last analyzed: {analysis.timestamp.toLocaleString()}
              </div>

              {/* Insights */}
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
                <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Key Insights
                </h4>
                <ul className="space-y-1">
                  {analysis.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-blue-400">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Patterns */}
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/50">
                <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Detected Patterns
                </h4>
                <ul className="space-y-1">
                  {analysis.patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-purple-400">•</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/50">
                <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-green-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Upload traffic data files and run AI analysis</p>
              <p className="text-xs text-slate-500 mt-1">
                {allRecords.length > 0
                  ? `${allRecords.length} records ready for analysis`
                  : 'No data available'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TrafficDataManager;
