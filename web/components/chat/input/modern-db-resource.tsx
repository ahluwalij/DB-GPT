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
  
  // Preset PostgreSQL credentials
  const PRESET_POSTGRES_CONFIG = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.eyernxegjjcfrwrupbtg',
    password: 'gYuhsMArUJZfw5ZH',
    database: 'postgres'
  };
  
  // States for database management
  const [allDatabases, setAllDatabases] = useState<DbListResponse>([]);
  const [dbSupportList, setDbSupportList] = useState<DbSupportTypeResponse>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [managementLoading, setManagementLoading] = useState(false);
  const [refreshingDb, setRefreshingDb] = useState<string | null>(null);
  
  // Local selection state for the popover
  const [selectedValue, setSelectedValue] = useState<string>('');

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

  // Initialize selectedValue when popover opens
  const handlePopoverOpen = (open: boolean) => {
    if (open) {
      setSelectedValue(value || '');
      loadAllDatabases();
    }
    setPopoverOpen(open);
  };

  // Handle saving the selection
  const handleSave = () => {
    onChange?.(selectedValue);
    setPopoverOpen(false);
  };

  // Handle canceling the selection
  const handleCancel = () => {
    setSelectedValue(value || '');
    setPopoverOpen(false);
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
    setSelectedType('postgresql'); // Default to PostgreSQL
    setFormData(PRESET_POSTGRES_CONFIG); // Pre-fill with preset values
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

      // For PostgreSQL, merge with preset values
      let params = formData;
      if (selectedType === 'postgresql' && !editingDb) {
        params = {
          ...PRESET_POSTGRES_CONFIG,
          ...formData, // Override with any user-provided values
        };
      }

      const data = {
        type: selectedType,
        params,
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
  const selectedDbLabel = value ? (databaseOptions.find(opt => opt.value === value)?.value || value) : "None";

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={handlePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-44 justify-between bg-gray-100 hover:bg-gray-200 font-medium transition-all duration-200 rounded-full px-3 py-1 text-sm"
            disabled={disabled}
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
                  <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
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
                className="h-8 bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Selection Section */}
            <div className="max-h-64 overflow-y-auto">
              {managementLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {/* None option */}
                  <div 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                      selectedValue === '' 
                        ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedValue('')}
                  >
                    <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                      {selectedValue === '' && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                    </div>
                    <span className="text-sm">None</span>
                  </div>

                  {/* Available databases from current scene */}
                  {databaseOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                        selectedValue === option.value 
                          ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setSelectedValue(option.value)}
                    >
                      <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                        {selectedValue === option.value && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {option.label}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show other configured databases */}
                  {(() => {
                    const connectedDbNames = databaseOptions.map(opt => opt.value);
                    const unconnectedDatabases = allDatabases.filter(db => 
                      !connectedDbNames.includes((db.params as any)?.database || (db.params as any)?.path || 'Unknown')
                    );
                    
                    return unconnectedDatabases.map((db) => {
                      const dbName = (db.params as any)?.database || (db.params as any)?.path || 'Unknown';
                      return (
                        <div key={db.id} className="group flex items-center justify-between p-2 rounded-lg font-medium transition-all duration-200">
                          <div 
                            className={`flex items-center gap-3 min-w-0 flex-1 cursor-pointer ${
                              selectedValue === dbName 
                                ? 'text-black-700' 
                                : 'text-gray-700 hover:text-gray-900'
                            }`}
                            onClick={() => setSelectedValue(dbName)}
                          >
                            <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                              {selectedValue === dbName && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                            </div>
                            <DBIcon
                              width={22}
                              height={22}
                              src={dbMapper[db.type]?.icon}
                              label={dbMapper[db.type]?.label}
                              className="flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{dbName}</p>
                              {db.description && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">{db.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-md hover:bg-gray-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshDatabase(db);
                              }}
                              disabled={refreshingDb === db.id}
                            >
                              <RefreshCw className={`h-3 w-3 text-gray-600 ${refreshingDb === db.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDatabase(db);
                              }}
                            >
                              <Edit3 className="h-3 w-3 text-black-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-md hover:bg-red-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDatabase(db);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Show empty state if no databases available */}
                  {databaseOptions.length === 0 && allDatabases.length === 0 && (
                    <div className="p-8 text-center">
                      <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No databases configured</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add" to create your first connection</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={selectedValue === value}
                className="bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 font-medium transition-all duration-200"
              >
                Save
              </Button>
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
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
            {selectedType === 'postgresql' && !editingDb ? (
              // Simplified PostgreSQL form - only show password field
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.password || PRESET_POSTGRES_CONFIG.password}
                    onChange={(e) => handleFormFieldChange('password', e.target.value)}
                    placeholder="Enter PostgreSQL password"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-800 mb-2">Connection Details:</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><strong>Host:</strong> {PRESET_POSTGRES_CONFIG.host}</p>
                    <p><strong>Port:</strong> {PRESET_POSTGRES_CONFIG.port}</p>
                    <p><strong>User:</strong> {PRESET_POSTGRES_CONFIG.user}</p>
                    <p><strong>Database:</strong> {PRESET_POSTGRES_CONFIG.database}</p>
                  </div>
                </div>
              </div>
            ) : (
              selectedDbType?.parameters && (
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
              )
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this database connection"
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
              className="bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
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