import {useState} from "react";
import {ChevronDown} from "lucide-react";
import {DeviceDropdownProps} from "../types/components.ts";

export function DeviceDropdown({icon, label, devices, selectedId, isLoading, onSelect}: DeviceDropdownProps) {
    const [open, setOpen] = useState(false);

    const selectedLabel =
        devices.find(d => d.deviceId === selectedId)?.label ?? `No ${label.toLowerCase()} found`;

    return (
        <div className={`relative ${open ? "z-50" : "z-0"}`}>
            <div
                className="flex items-center gap-[clamp(0.625rem,1.8vw,0.75rem)] rounded-[clamp(0.875rem,2vw,1rem)] border border-border bg-surface p-[clamp(0.75rem,2vw,1rem)] backdrop-blur-[10px] cursor-pointer"
                onClick={() => setOpen(o => !o)}
            >
                <div
                    className="flex size-[clamp(2.5rem,5vw,2.75rem)] shrink-0 items-center justify-center rounded-lg bg-brand-muted">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs text-text-secondary mb-1">{label}</div>
                    <div className="truncate text-sm text-text-primary sm:text-base" title={selectedLabel}>
                        {isLoading ? "Detecting..." : selectedLabel}
                    </div>
                </div>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </div>

            {open && devices.length > 0 && (
                <ul className="absolute z-[60] mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface backdrop-blur-[10px]">
                    {devices.map(device => (
                        <li
                            key={device.deviceId}
                            className={`truncate px-4 py-3 text-sm text-text-primary cursor-pointer transition-colors hover:bg-brand-muted sm:text-base ${device.deviceId === selectedId ? "text-brand" : ""}`}
                            title={device.label}
                            onClick={() => {
                                onSelect(device.deviceId);
                                setOpen(false);
                            }}
                        >
                            {device.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
