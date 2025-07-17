"use client";

import { apiInterceptors, getDbList, getDbSupportType, postDbDelete, postDbRefresh, postDbAdd, postDbEdit, postDbTestConnect } from '@/client/api';
import DBIcon from '@/components/common/db-icon';
import { DBOption, DBType, DbListResponse, DbSupportTypeResponse } from '@/types/db';
import { ConfigurableParams } from '@/types/common';
import { dbMapper } from '@/utils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Database, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ChevronDown,
  Loader2
} from 'lucide-react';

type DBItem = DbListResponse[0];

interface ModernDBResourceProps {
  value?: string;
  onChange?: (value: string) => void;
  databaseOptions?: Array<{label: any; value: string}>;
  disabled?: boolean;
  loading?: boolean;
}

function ModernDBResource({ value, onChange, databaseOptions = [], disabled = false, loading = false }: ModernDBResourceProps) {
  
  // States for database management
  const [allDatabases, setAllDatabases] = useState<DbListResponse>([]);
  const [dbSupportList, setDbSupportList] = useState<DbSupportTypeResponse>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [managementLoading, setManagementLoading] = useState(false);
  const [refreshingDb, setRefreshingDb] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDb, setEditingDb] = useState<DBItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDb, setDeletingDb] = useState<DBItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState<DBType | undefined>();
  const [formData, setFormData] = useState<any>({});
  const [description, setDescription] = useState('');

  // Load all databases and support types
  const loadAllDatabases = async () => {
    setManagementLoading(true);
    try {
      const [, dbData] = await apiInterceptors(getDbList());
      const [, supportData] = await apiInterceptors(getDbSupportType());
      setAllDatabases(dbData ?? []);
      setDbSupportList(supportData?.types ?? []);
    } finally {
      setManagementLoading(false);
    }
  };

  // Get supported database types (only PostgreSQL as per original code)
  const dbTypeList = useMemo(() => {
    const supportDbList = (Array.isArray(dbSupportList) ? dbSupportList : [])
      .filter(item => item?.name === 'postgresql')
      .map(item => {
        const db_type = item?.name;
        return { ...dbMapper[db_type], value: db_type, isFileDb: true, parameters: item.parameters };
      }) as DBOption[];
    
    const unSupportDbList = Object.keys(dbMapper)
      .filter(item => item === 'postgresql' && !supportDbList.some(db => db.value === item))
      .map(item => ({
        ...dbMapper[item],
        value: dbMapper[item].label,
        disabled: true,
      })) as DBOption[];
    
    return [...supportDbList, ...unSupportDbList];
  }, [dbSupportList]);

  const handleAddDatabase = () => {
    setEditingDb(null);
    setSelectedType(undefined);
    setFormData({});
    setDescription('');
    setModalOpen(true);
  };

  const handleEditDatabase = (db: DBItem) => {
    setEditingDb(db);
    setSelectedType(db.type);
    setFormData(db.params);
    setDescription(db.description || '');
    setModalOpen(true);
  };

  const handleDeleteDatabase = (db: DBItem) => {
    setDeletingDb(db);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDb) return;
    
    try {
      const [err] = await apiInterceptors(postDbDelete(deletingDb.id));
      if (err) {
        toast.error("Failed to delete database");
        return;
      }
      
      toast.success("Database deleted successfully");
      loadAllDatabases();
    } catch (error) {
      toast.error("Failed to delete database");
    } finally {
      setDeleteModalOpen(false);
      setDeletingDb(null);
    }
  };

  const handleRefreshDatabase = async (db: DBItem) => {
    setRefreshingDb(db.id);
    try {
      const [, res] = await apiInterceptors(postDbRefresh({ id: db.id }));
      if (res) {
        toast.success("Database refreshed successfully");
      }
    } catch (error) {
      toast.error("Failed to refresh database");
    } finally {
      setRefreshingDb(null);
    }
  };

  const handleSubmitForm = async () => {
    if (!selectedType) return;

    try {
      setFormSubmitting(true);

      const data = {
        type: selectedType,
        params: formData,
        description: description || '',
      };

      // If editing, add the ID
      if (editingDb) {
        (data as any).id = editingDb.id;
      }

      // Test connection first
      const [testErr] = await apiInterceptors(postDbTestConnect(data));
      if (testErr) {
        toast.error("Database connection test failed");
        return;
      }

      // Add or edit database
      const [err] = await apiInterceptors((editingDb ? postDbEdit : postDbAdd)(data));
      if (err) {
        toast.error(err.message || "Failed to save database");
        return;
      }

      toast.success(editingDb ? "Database updated successfully" : "Database added successfully");
      setModalOpen(false);
      loadAllDatabases();
    } catch (error) {
      toast.error(editingDb ? "Failed to update database" : "Failed to add database");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFormFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderFormField = (param: ConfigurableParams) => {
    const type = param.param_type.toLowerCase();
    const fieldValue = formData[param.param_name] ?? param.default_value ?? '';

    if (type === 'str' || type === 'string') {
      return (
        <Input
          type={param.ext_metadata?.tags?.includes('privacy') ? 'password' : 'text'}
          value={fieldValue}
          onChange={(e) => handleFormFieldChange(param.param_name, e.target.value)}
          placeholder={param.description || param.label || param.param_name}
        />
      );
    }

    if (type === 'int' || type === 'integer' || type === 'number' || type === 'float') {
      return (
        <Input
          type="number"
          value={fieldValue}
          onChange={(e) => handleFormFieldChange(param.param_name, e.target.value)}
          placeholder={param.description || param.label || param.param_name}
        />
      );
    }

    return (
      <Input
        value={fieldValue}
        onChange={(e) => handleFormFieldChange(param.param_name, e.target.value)}
        placeholder={param.description || param.label || param.param_name}
      />
    );
  };

  const selectedDbType = dbTypeList.find(type => type.value === selectedType);

  // Find currently selected database label
  const selectedDbLabel = databaseOptions.find(opt => opt.value === value)?.value || value || "Select Database";

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-44 justify-between bg-white hover:bg-gray-50 border-gray-200"
            disabled={disabled}
            onClick={() => {
              if (!popoverOpen) {
                loadAllDatabases();
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {value && databaseOptions.length > 0 ? (
                // Show the actual database icon if we have a selection
                databaseOptions.find(opt => opt.value === value)?.label || (
                  <>
                    <Database className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="truncate text-sm text-gray-700">{selectedDbLabel}</span>
                  </>
                )
              ) : (
                <>
                  <Database className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="truncate text-sm text-gray-700">{selectedDbLabel}</span>
                </>
              )}
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
          align="start"
          style={{ backgroundColor: 'white !important' }}
        >
          <div className="bg-white rounded-lg" style={{ backgroundColor: 'white !important' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800">Database Connections</h3>
              <Button
                size="sm"
                onClick={handleAddDatabase}
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Active Databases - only show if there are available databases for this scene */}
            {databaseOptions.length > 0 && (
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Active</p>
                {databaseOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      value === option.value ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      onChange?.(option.value);
                      setPopoverOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}

            {/* All Databases - only show databases that are not already connected to this scene */}
            <div className="max-h-64 overflow-y-auto">
              {managementLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (() => {
                // Filter out databases that are already in databaseOptions
                const connectedDbNames = databaseOptions.map(opt => opt.value);
                const unconnectedDatabases = allDatabases.filter(db => 
                  !connectedDbNames.includes((db.params as any)?.database || (db.params as any)?.path || 'Unknown')
                );
                
                return unconnectedDatabases.length > 0 ? (
                  <div className="p-2">
                    <p className="text-xs text-gray-500 px-2 py-1 mb-2">All Connections</p>
                    {unconnectedDatabases.map((db) => (
                    <div key={db.id} className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                      <div 
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          const dbValue = (db.params as any)?.database || (db.params as any)?.path || 'Unknown';
                          onChange?.(dbValue);
                          setPopoverOpen(false);
                        }}
                      >
                        <DBIcon
                          width={20}
                          height={20}
                          src={dbMapper[db.type]?.icon}
                          label={dbMapper[db.type]?.label}
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 truncate">
                            {(db.params as any)?.database || (db.params as any)?.path || 'Unknown'}
                          </p>
                          {db.description && (
                            <p className="text-xs text-gray-500 truncate">{db.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleRefreshDatabase(db)}
                          disabled={refreshingDb === db.id}
                        >
                          <RefreshCw className={`h-3 w-3 text-gray-600 ${refreshingDb === db.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEditDatabase(db)}
                        >
                          <Edit3 className="h-3 w-3 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDeleteDatabase(db)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    ))}
                  </div>
                ) : databaseOptions.length === 0 ? (
                  <div className="p-8 text-center">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No databases configured</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add" to create your first connection</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">All databases are already connected to this chat</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Database Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border border-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editingDb ? 'Edit Database Connection' : 'Add Database Connection'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingDb ? 'Update your database connection settings.' : 'Configure a new database connection.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Database Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value as DBType)}
                disabled={!!editingDb}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select database type</option>
                {dbTypeList.map(type => (
                  <option key={type.value} value={type.value} disabled={type.disabled}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Form Fields */}
            {selectedDbType?.parameters && (
              <div className="space-y-4">
                {selectedDbType.parameters.map((param) => (
                  <div key={param.param_name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {param.label || param.param_name}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFormField(param)}
                    {param.description && (
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this database connection"
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSubmitForm}
              disabled={formSubmitting || !selectedType}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingDb ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingDb ? 'Update Database' : 'Add Database'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Delete Database Connection</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete the database connection "{(deletingDb?.params as any)?.database || (deletingDb?.params as any)?.path}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ModernDBResource;