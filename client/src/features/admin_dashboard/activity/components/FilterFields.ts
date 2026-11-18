import { FilterField } from "./FilterBar";

export const SESSION_FIELDS: FilterField[] = [
  {
    name: "type", label: "Visitor", kind: "select",
    options: [
      { value: "", label: "All" },
      { value: "user", label: "Logged-in users" },
      { value: "anonymous", label: "Anonymous" },
    ],
  },
  { name: "country", label: "Country (code)", kind: "text", placeholder: "BD" },
  { name: "ip", label: "IP", kind: "text", placeholder: "103.4.5.6" },
  {
    name: "device", label: "Device", kind: "select",
    options: [
      { value: "", label: "All" },
      { value: "desktop", label: "Desktop" },
      { value: "mobile", label: "Mobile" },
      { value: "tablet", label: "Tablet" },
    ],
  },
  {
    name: "isBot", label: "Bots", kind: "select",
    options: [
      { value: "", label: "Include" },
      { value: "false", label: "Hide bots" },
      { value: "true", label: "Only bots" },
    ],
  },
  { name: "from", label: "From", kind: "date" },
  { name: "to", label: "To", kind: "date" },
  { name: "devtools", label: "DevTools suspected", kind: "checkbox", value: "true" },
];

export const EVENT_FIELDS: FilterField[] = [
  {
    name: "type", label: "Event type", kind: "select",
    options: [
      { value: "", label: "All" },
      ...["page_view", "click", "rage_click", "scroll", "visibility", "devtools_suspected", "error",
        "copy", "paste", "right_click", "form_submit", "custom"].map((t) => ({ value: t, label: t })),
    ],
  },
  { name: "path", label: "Path contains", kind: "text", placeholder: "/pricing" },
  { name: "ip", label: "IP", kind: "text" },
  { name: "from", label: "From", kind: "date" },
  { name: "to", label: "To", kind: "date" },
];