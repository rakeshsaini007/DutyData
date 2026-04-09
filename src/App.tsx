import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Search, Save, RefreshCw, User, Phone, Mail, CreditCard, Building2, MapPin, Hash } from "lucide-react";

// Replace this with your actual Google Apps Script Web App URL after deployment
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3iXnKtx0KKiNd1zwXJpbbtQpG49racC3kTogZSaJ-c7vN4s4mk0bWmeuIh8WBk5sLqw/exec";

interface FormData {
  NAME: string;
  EMAIL: string;
  MOBILE: string;
  SEX: string;
  AGE: string;
  Designation: string;
  "PAN Number": string;
  "Office Name": string;
  "Office Address with pin code": string;
  "Adhar Number": string;
  "Account Number": string;
  "IFSC Code": string;
  "BANK NAME": string;
  "BRANCH": string;
  "EHRMS CODE": string;
  MasterFilter: string;
}

const initialFormData: FormData = {
  NAME: "",
  EMAIL: "",
  MOBILE: "",
  SEX: "",
  AGE: "",
  Designation: "",
  "PAN Number": "",
  "Office Name": "",
  "Office Address with pin code": "",
  "Adhar Number": "",
  "Account Number": "",
  "IFSC Code": "",
  "BANK NAME": "",
  "BRANCH": "",
  "EHRMS CODE": "",
  MasterFilter: "",
};

export default function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    
    // Mandatory check for fields defined in initialFormData
    Object.keys(initialFormData).forEach((key) => {
      const field = key as keyof FormData;
      if (field === "MasterFilter") return; // Skip hidden field
      
      const value = formData[field]?.toString().trim() || "";
      if (value === "") {
        errors[field] = "This field is mandatory.";
      }
    });

    // Mobile validation
    const mobileRegex = /^[0-9]{10}$/;
    const mobile = formData.MOBILE?.toString().trim() || "";
    if (mobile !== "" && !mobileRegex.test(mobile)) {
      errors.MOBILE = "Must be exactly 10 digits.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = formData.EMAIL?.toString().trim() || "";
    if (email !== "" && !emailRegex.test(email)) {
      errors.EMAIL = "Please enter a valid email address.";
    }

    // PAN Number validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const pan = formData["PAN Number"]?.toString().trim() || "";
    if (pan !== "" && !panRegex.test(pan)) {
      errors["PAN Number"] = "Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)";
    }

    // Adhar Number validation
    const adharRegex = /^[0-9]{12}$/;
    const adhar = formData["Adhar Number"]?.toString().trim() || "";
    if (adhar !== "" && !adharRegex.test(adhar)) {
      errors["Adhar Number"] = "Must be exactly 12 digits.";
    }

    // Account Number validation
    const accountRegex = /^[0-9]{11,}$/;
    const account = formData["Account Number"]?.toString().trim() || "";
    if (account !== "" && !accountRegex.test(account)) {
      errors["Account Number"] = "Must be numeric and 11+ digits.";
    }

    // IFSC Code validation
    const ifscRegex = /^[A-Z]{4}[0-9]{1}[A-Z0-9]{6}$/;
    const ifsc = formData["IFSC Code"]?.toString().trim() || "";
    if (ifsc !== "" && !ifscRegex.test(ifsc)) {
      errors["IFSC Code"] = "Format: 4 letters, 1 zero, 6 alphanumeric.";
    }

    // EHRMS CODE validation
    const ehrmsRegex = /^[0-9]+$/;
    const ehrms = formData["EHRMS CODE"]?.toString().trim() || "";
    if (ehrms !== "" && !ehrmsRegex.test(ehrms)) {
      errors["EHRMS CODE"] = "Must be numeric.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, MOBILE: value }));
    
    // Reset state if mobile is not 10 digits
    if (value.length !== 10) {
      setIsExisting(false);
      setError(null);
      setFieldErrors({});
    } else {
      fetchData(value);
    }
  };

  const fetchData = async (mobile: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${APPS_SCRIPT_URL}?mobile=${mobile}`);
      if (response.data.success) {
        if (response.data.exists) {
          // Filter fetched data to only include known fields
          const fetchedData = response.data.data;
          const filteredData: Partial<FormData> = {};
          Object.keys(initialFormData).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(fetchedData, key)) {
              filteredData[key as keyof FormData] = fetchedData[key];
            }
          });
          
          setFormData(prev => ({ ...prev, ...filteredData }));
          setIsExisting(true);
          toast.success("Data fetched successfully!");
        } else {
          setIsExisting(false);
          // Keep the mobile number but reset other fields if not found
          setFormData(prev => ({ ...initialFormData, MOBILE: prev.MOBILE }));
          toast.info("No existing record found for this mobile number.");
        }
      } else {
        setError(response.data.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Error connecting to the server. Please check your Apps Script URL.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isExisting) {
      toast.error("Access Denied: This mobile number is not registered in our records.");
      return;
    }

    if (!validate()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Note: Apps Script doPost requires a specific content type or handling
      // For simple web apps, we often use a proxy or just send JSON
      const response = await axios.post(APPS_SCRIPT_URL, JSON.stringify(formData), {
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setIsExisting(true);
      } else {
        setError(response.data.error || "Failed to save data");
      }
    } catch (err) {
      setError("Error saving data. Please ensure CORS is handled in Apps Script.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = (field: keyof FormData) => {
    // If it's a new record, nothing is readonly
    if (!isExisting) return false;
    
    // If the field is currently empty or has a validation error, allow editing
    if (!formData[field] || formData[field].toString().trim() === "") return false;
    if (fieldErrors[field]) return false;

    // For existing records, these fields are readonly
    const readonlyFields: (keyof FormData)[] = [
      "NAME", "SEX", "Designation", 
      "Office Name", "Office Address with pin code"
    ];
    return readonlyFields.includes(field);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-2 sm:mb-4">
            SheetSync Pro
          </h1>
          <p className="text-base sm:text-lg text-slate-600 px-4">
            Securely manage and sync your personnel data with Google Sheets.
          </p>
        </div>

        <Card className="shadow-xl border-slate-200 overflow-hidden rounded-xl sm:rounded-2xl">
          <CardHeader className="bg-slate-900 text-white p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold">Data Management Portal</CardTitle>
                <CardDescription className="text-slate-300 mt-1 sm:mt-2 text-sm sm:text-base">
                  Enter mobile number to fetch or update records
                </CardDescription>
              </div>
              <div className="bg-slate-800 p-2 sm:p-3 rounded-full shrink-0">
                <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${loading ? 'animate-spin' : ''}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Mobile Number Section */}
              <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
                <div className="max-w-md">
                  <Label htmlFor="MOBILE" className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Mobile Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      <Input
                        id="MOBILE"
                        type="tel"
                        placeholder="10-digit mobile"
                        className={`pl-9 sm:pl-10 h-11 sm:h-12 text-base sm:text-lg border-slate-300 focus:ring-slate-900 focus:border-slate-900 ${fieldErrors.MOBILE ? 'border-red-500' : ''}`}
                        value={formData.MOBILE}
                        onChange={handleMobileChange}
                        required
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-11 sm:h-12 px-3 sm:px-4 border-slate-300 hover:bg-slate-100"
                      onClick={() => fetchData(formData.MOBILE)}
                      disabled={loading || formData.MOBILE.length < 10}
                    >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                  {fieldErrors.MOBILE && <p className="text-xs text-red-500 mt-1">{fieldErrors.MOBILE}</p>}
                  <p className="mt-2 text-[10px] sm:text-xs text-slate-400">
                    Data will auto-fetch once 10 digits are entered.
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Data Grid */}
              {isExisting ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-5 h-5" /> Personal Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="NAME">Full Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="NAME" 
                        value={formData.NAME} 
                        readOnly={isReadOnly("NAME")} 
                        className={`${isReadOnly("NAME") ? 'bg-slate-50' : ''} ${fieldErrors.NAME ? 'border-red-500' : ''}`}
                        onChange={(e) => setFormData(prev => ({ ...prev, NAME: e.target.value }))}
                      />
                      {fieldErrors.NAME && <p className="text-xs text-red-500 mt-1">{fieldErrors.NAME}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="SEX">Sex <span className="text-red-500">*</span></Label>
                        <Input 
                          id="SEX" 
                          value={formData.SEX} 
                          readOnly={isReadOnly("SEX")} 
                          className={`${isReadOnly("SEX") ? 'bg-slate-50' : ''} ${fieldErrors.SEX ? 'border-red-500' : ''}`}
                          onChange={(e) => setFormData(prev => ({ ...prev, SEX: e.target.value }))}
                        />
                        {fieldErrors.SEX && <p className="text-xs text-red-500 mt-1">{fieldErrors.SEX}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="AGE">Age <span className="text-red-500">*</span></Label>
                        <Input 
                          id="AGE" 
                          type="number"
                          min="0"
                          max="120"
                          value={formData.AGE} 
                          readOnly={isReadOnly("AGE")} 
                          className={`${isReadOnly("AGE") ? 'bg-slate-50' : ''} ${fieldErrors.AGE ? 'border-red-500' : ''}`}
                          onChange={(e) => setFormData(prev => ({ ...prev, AGE: e.target.value }))}
                        />
                        {fieldErrors.AGE && <p className="text-xs text-red-500 mt-1">{fieldErrors.AGE}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="EMAIL">Email Address <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="EMAIL" 
                          className={`pl-10 ${fieldErrors.EMAIL ? 'border-red-500 focus:ring-red-500' : ''}`}
                          value={formData.EMAIL} 
                          onChange={(e) => setFormData(prev => ({ ...prev, EMAIL: e.target.value }))}
                        />
                      </div>
                      {fieldErrors.EMAIL && <p className="text-xs text-red-500 mt-1">{fieldErrors.EMAIL}</p>}
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5" /> Professional Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="Designation">Designation <span className="text-red-500">*</span></Label>
                      <Input 
                        id="Designation" 
                        value={formData.Designation} 
                        readOnly={isReadOnly("Designation")} 
                        className={`${isReadOnly("Designation") ? 'bg-slate-50' : ''} ${fieldErrors.Designation ? 'border-red-500' : ''}`}
                        onChange={(e) => setFormData(prev => ({ ...prev, Designation: e.target.value }))}
                      />
                      {fieldErrors.Designation && <p className="text-xs text-red-500 mt-1">{fieldErrors.Designation}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="Office Name">Office Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="Office Name" 
                        value={formData["Office Name"]} 
                        readOnly={isReadOnly("Office Name")} 
                        className={`${isReadOnly("Office Name") ? 'bg-slate-50' : ''} ${fieldErrors["Office Name"] ? 'border-red-500' : ''}`}
                        onChange={(e) => setFormData(prev => ({ ...prev, "Office Name": e.target.value }))}
                      />
                      {fieldErrors["Office Name"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["Office Name"]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="Office Address with pin code">Office Address <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea 
                          id="Office Address with pin code" 
                          readOnly={isReadOnly("Office Address with pin code")} 
                          className={`w-full min-h-[80px] rounded-md border ${fieldErrors["Office Address with pin code"] ? 'border-red-500' : 'border-slate-200'} ${isReadOnly("Office Address with pin code") ? 'bg-slate-50' : ''} px-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                          value={formData["Office Address with pin code"]}
                          onChange={(e) => setFormData(prev => ({ ...prev, "Office Address with pin code": e.target.value }))}
                        />
                      </div>
                      {fieldErrors["Office Address with pin code"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["Office Address with pin code"]}</p>}
                    </div>
                  </div>

                  {/* Identity & Banking */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Identity & Banking
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="PAN Number">PAN Number <span className="text-red-500">*</span></Label>
                        <Input 
                          id="PAN Number" 
                          className={fieldErrors["PAN Number"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["PAN Number"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "PAN Number": e.target.value.toUpperCase() }))}
                        />
                        {fieldErrors["PAN Number"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["PAN Number"]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="Adhar Number">Aadhaar Number <span className="text-red-500">*</span></Label>
                        <Input 
                          id="Adhar Number" 
                          className={fieldErrors["Adhar Number"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["Adhar Number"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "Adhar Number": e.target.value }))}
                        />
                        {fieldErrors["Adhar Number"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["Adhar Number"]}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="Account Number">Account Number <span className="text-red-500">*</span></Label>
                        <Input 
                          id="Account Number" 
                          className={fieldErrors["Account Number"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["Account Number"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "Account Number": e.target.value }))}
                        />
                        {fieldErrors["Account Number"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["Account Number"]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="IFSC Code">IFSC Code <span className="text-red-500">*</span></Label>
                        <Input 
                          id="IFSC Code" 
                          className={fieldErrors["IFSC Code"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["IFSC Code"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "IFSC Code": e.target.value.toUpperCase() }))}
                        />
                        {fieldErrors["IFSC Code"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["IFSC Code"]}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="BANK NAME">Bank Name <span className="text-red-500">*</span></Label>
                        <Input 
                          id="BANK NAME" 
                          className={fieldErrors["BANK NAME"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["BANK NAME"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "BANK NAME": e.target.value.toUpperCase() }))}
                        />
                        {fieldErrors["BANK NAME"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["BANK NAME"]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="BRANCH">Branch <span className="text-red-500">*</span></Label>
                        <Input 
                          id="BRANCH" 
                          className={fieldErrors["BRANCH"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["BRANCH"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "BRANCH": e.target.value.toUpperCase() }))}
                        />
                        {fieldErrors["BRANCH"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["BRANCH"]}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="EHRMS CODE">EHRMS Code <span className="text-red-500">*</span></Label>
                        <Input 
                          id="EHRMS CODE" 
                          className={fieldErrors["EHRMS CODE"] ? 'border-red-500 focus:ring-red-500' : ''}
                          value={formData["EHRMS CODE"]} 
                          onChange={(e) => setFormData(prev => ({ ...prev, "EHRMS CODE": e.target.value }))}
                        />
                        {fieldErrors["EHRMS CODE"] && <p className="text-xs text-red-500 mt-1">{fieldErrors["EHRMS CODE"]}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : formData.MOBILE.length === 10 && !loading ? (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center animate-in zoom-in-95 duration-300">
                  <Hash className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Access Restricted</h3>
                  <p className="text-amber-700">
                    This mobile number is not registered in our database. 
                    Please contact the administrator to register your number.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-xl text-center">
                  <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Enter a registered mobile number to access the form.</p>
                </div>
              )}

              {isExisting && (
                <div className="pt-6 border-t border-slate-100 flex justify-center sm:justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto h-12 px-8 text-lg font-semibold bg-slate-900 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Update Record
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
          
          <CardFooter className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200 justify-center">
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 text-center">
              <CreditCard className="w-4 h-4 shrink-0" /> All data is securely synced with your Google Sheet
            </p>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-slate-400 text-xs">
          &copy; 2026 SheetSync Pro. Built with React & Google Apps Script.
        </div>
      </div>
    </div>
  );
}
