import {Attendee} from "../types/pages.ts";

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

export const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const FALLBACK_ATTENDEES: Attendee[] = [
    {name: "You", initials: "YO"},
    {name: "Sarah Chen", initials: "SC"},
    {name: "Michael Brown", initials: "MB"},
];

export const RESOLUTION_PRESETS = [
    {value: '1280x720', label: 'HD (1280 x 720)', width: 1280, height: 720},
    {value: '1920x1080', label: 'Full HD (1920 x 1080)', width: 1920, height: 1080},
    {value: '854x480', label: 'SD (854 x 480)', width: 854, height: 480},
    {value: '640x360', label: 'nHD (640 x 360)', width: 640, height: 360},
]

export const CUSTOM_RESOLUTION = 'custom'