import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { MapPin, Camera, CameraOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { calculateDistance } from "@/lib/timeUtils";
import { supabase } from "@/supabase";
import { toast } from "sonner";

const QRScanner = ({
    onScanSuccess,
    onScanError,
    requiredDistance = 150, // 150 meters for industrial use
    action = "scan", // "entry", "lunch", "leave"
    currentShiftSiteId = null // For validating same site actions
}) => {
    const [scanning, setScanning] = useState(false);
    const [locationPermission, setLocationPermission] = useState(null);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [scannedData, setScannedData] = useState(null);
    const [siteInfo, setSiteInfo] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    // Request permissions on mount and set up continuous location tracking
    useEffect(() => {
        requestPermissions();

        // Set up continuous location tracking for real-time EVT validation
        let locationWatchId = null;
        if (navigator.geolocation) {
            locationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    setCurrentLocation(newLocation);

                    // Log location accuracy (only warn for very poor accuracy)
                    if (position.coords.accuracy > 100) {
                        console.warn(`Location accuracy: ${Math.round(position.coords.accuracy)}m (should be <100m for better accuracy)`);
                        toast.warning("Location accuracy is low. Please ensure you're at the correct site.");
                    }
                },
                (error) => {
                    console.error('Continuous location tracking error:', error);
                    toast.error("Location tracking failed. Please check GPS.");
                    setLocationPermission(false);
                },
                {
                    enableHighAccuracy: true, // Critical for industrial EVT
                    maximumAge: 10000, // Accept locations up to 10 seconds old
                    timeout: 15000 // Timeout after 15 seconds
                }
            );
        }

        return () => {
            // Cleanup
            if (scannerInstanceRef.current) {
                scannerInstanceRef.current.clear().catch(console.error);
            }
            if (locationWatchId) {
                navigator.geolocation.clearWatch(locationWatchId);
            }
        };
    }, []);

    const requestPermissions = async () => {
        try {
            // Request camera permission
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    setCameraPermission(true);
                } catch (error) {
                    setCameraPermission(false);
                    toast.error("Camera permission denied");
                }
            }

            // Request location permission
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCurrentLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        setLocationPermission(true);
                    },
                    (error) => {
                        console.error('Location error:', error);
                        // Don't block scanning if location permission is denied
                        setLocationPermission(true);
                        toast.warning("Location permission not granted. Some features may be limited.");
                    }
                );
            }
        } catch (error) {
            console.error('Permission request error:', error);
        }
    };

    const startScanning = () => {
        if (!cameraPermission) {
            toast.error("Camera permission required");
            return;
        }
        if (!locationPermission) {
            toast.error("Location permission required");
            return;
        }

        setScanning(true);
        setScannedData(null);
        setSiteInfo(null);

        // Initialize scanner
        scannerInstanceRef.current = new Html5QrcodeScanner(
            scannerRef.current.id,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            },
            false
        );

        scannerInstanceRef.current.render(
            onScanSuccessInternal,
            onScanErrorInternal
        );
    };

    const stopScanning = () => {
        setScanning(false);
        if (scannerInstanceRef.current) {
            scannerInstanceRef.current.clear().catch(console.error);
        }
    };

    const onScanSuccessInternal = async (decodedText, decodedResult) => {
        if (scannedData) return; // Prevent multiple scans

        // Clean up the QR code data
        const qrToken = decodedText.trim();
        console.log('QR Code scanned, token:', qrToken);

        setScannedData(qrToken);
        setScanning(false);

        if (scannerInstanceRef.current) {
            scannerInstanceRef.current.clear().catch(console.error);
        }

        setIsValidating(true);

        try {
            if (!qrToken) {
                throw new Error("Invalid QR code: Empty code");
            }

            // Fetch site information with better error handling
            console.log('Looking up site with token:', qrToken);
            const { data: site, error: siteError } = await supabase
                .from('sites')
                .select('*')
                .eq('qr_token', qrToken)
                .single();

            if (siteError) {
                console.error('Site lookup error:', siteError);
                throw new Error("Failed to verify site. Please try again.");
            }

            if (!site) {
                console.error('Site not found for token:', qrToken);
                throw new Error("Invalid site QR code. Please contact your supervisor.");
            }

            console.log('Found site:', site);

            setSiteInfo(site);

            // For clock out and lunch, validate that we're at the same site as entry
            if ((action === 'leave' || action === 'breaks') && currentShiftSiteId) {
                console.log('Validating site match:', { currentShiftSiteId, scannedSiteId: site.id });
                if (currentShiftSiteId !== site.id) {
                    const errorMsg = `You must ${action} at the same site where you clocked in`;
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
            }

            // Real-time location validation for industrial EVT use
            if (currentLocation) {
                const distance = calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    site.latitude,
                    site.longitude
                );

                if (distance > requiredDistance) {
                    toast.error(`Location validation failed: ${Math.round(distance)}m from site (max: ${requiredDistance}m)`);
                    onScanError && onScanError(`Too far from site: ${Math.round(distance)}m > ${requiredDistance}m`);
                    setIsValidating(false);
                    return;
                }
            } else {
                // If we don't have location data, require it for industrial use
                toast.error("Location data unavailable. Please ensure GPS is enabled for EVT validation.");
                onScanError && onScanError("Location data unavailable");
                setIsValidating(false);
                return;
            }

            // Success
            toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} scan successful at ${site.site_name}`);
            onScanSuccess && onScanSuccess(site, qrToken);

        } catch (error) {
            console.error('Scan validation error:', error);
            toast.error("Scan validation failed");
            onScanError && onScanError("Validation error");
        } finally {
            setIsValidating(false);
        }
    };

    const onScanErrorInternal = (errorMessage) => {
        // Ignore common errors during scanning
        console.debug('QR scan error:', errorMessage);
    };

    const getStatusColor = () => {
        if (!locationPermission || !cameraPermission) return "destructive";
        if (scanning) return "default";
        if (scannedData && siteInfo) return "default"; // success
        return "secondary";
    };

    const getStatusText = () => {
        if (!locationPermission) return "Location permission required";
        if (!cameraPermission) return "Camera permission required";
        if (isValidating) return "Validating scan...";
        if (scanning) return "Scanning for QR code...";
        if (scannedData && siteInfo) return `Scanned: ${siteInfo.site_name}`;
        return "Ready to scan";
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    QR Scanner
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusColor()}>
                        {getStatusText()}
                    </Badge>
                    {currentLocation && (
                        <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            GPS: ±{Math.round(currentLocation.accuracy || 0)}m
                        </Badge>
                    )}
                    {currentLocation && currentLocation.accuracy > 50 && (
                        <Badge variant="destructive" className="text-xs">
                            Low Accuracy
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* QR Scanner Container */}
                <div
                    id={`qr-scanner-${Math.random().toString(36).substr(2, 9)}`}
                    ref={scannerRef}
                    className="w-full"
                    style={{ display: scanning ? 'block' : 'none' }}
                />

                {/* Permissions Status */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        {cameraPermission ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        Camera
                    </div>
                    <div className="flex items-center gap-2">
                        {locationPermission ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        Location
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {!scanning ? (
                        <Button
                            onClick={startScanning}
                            disabled={!cameraPermission || !locationPermission || isValidating}
                            className="flex-1"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Start Scan
                        </Button>
                    ) : (
                        <Button
                            onClick={stopScanning}
                            variant="outline"
                            className="flex-1"
                        >
                            <CameraOff className="w-4 h-4 mr-2" />
                            Stop Scan
                        </Button>
                    )}
                </div>

                {/* Site Info */}
                {siteInfo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Site Validated</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {siteInfo.site_name}
                        </p>
                        <p className="text-xs text-green-600">
                            {siteInfo.latitude.toFixed(6)}, {siteInfo.longitude.toFixed(6)}
                        </p>
                    </div>
                )}

                {/* Validation Loading */}
                {isValidating && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-blue-600">Validating...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default QRScanner;
