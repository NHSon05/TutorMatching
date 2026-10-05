import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";

// Import components directly from main barrel export
import {
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Slider,
  TextField,
  TextArea,
  SearchField,
  PromptField,
  SegmentedControl,
  Star,
  Dropdown,
  SelectCheck,
  DatePicker,
  DateRangePicker,
  FileUpload,
  Attachment,
  Spinner,
  Skeleton,
  Badge,
  ToastProvider,
  Dialog,
  Sheet,
  Avatar,
  AvatarGroup,
  Image,
  Card,
  CardTitle,
  Accordion,
  ChipBar,
  WelcomeBanner,
  FAB,
  Timeline,
  Calendar,
  EventCalendar,
  GanttChart,
} from "../src/components";

describe("Design System 33 Components Suite", () => {
  it("renders form controls (Checkbox, Radio, Switch, Slider, TextField, TextArea)", () => {
    render(
      <div>
        <Checkbox label="Test Checkbox" />
        <RadioGroup value="opt1">
          <Radio value="opt1" label="Radio Opt 1" />
        </RadioGroup>
        <Switch label="Test Switch" />
        <Slider label="Test Slider" value={50} />
        <TextField label="Test Field" placeholder="Enter text" />
        <TextArea label="Test Area" placeholder="Enter area" />
      </div>
    );
    expect(screen.getByText("Test Checkbox")).toBeInTheDocument();
    expect(screen.getByText("Radio Opt 1")).toBeInTheDocument();
    expect(screen.getByText("Test Switch")).toBeInTheDocument();
    expect(screen.getByText("Test Slider")).toBeInTheDocument();
    expect(screen.getByText("Test Field")).toBeInTheDocument();
    expect(screen.getByText("Test Area")).toBeInTheDocument();
  });

  it("renders interactive search and inputs (SearchField, PromptField, SegmentedControl, Star)", () => {
    render(
      <div>
        <SearchField placeholder="Search tutors..." />
        <PromptField placeholder="Ask AI..." />
        <SegmentedControl options={[{ value: "1", label: "Tab 1" }]} />
        <Star value={4} showScore />
      </div>
    );
    expect(screen.getByPlaceholderText("Search tutors...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask AI...")).toBeInTheDocument();
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("4.0")).toBeInTheDocument();
  });

  it("renders complex pickers and uploads (Dropdown, SelectCheck, DatePicker, DateRangePicker, FileUpload, Attachment)", () => {
    render(
      <div>
        <Dropdown placeholder="Choose subject" options={[{ value: "math", label: "Toán học" }]} />
        <SelectCheck placeholder="Choose grades" options={[{ value: "10", label: "Lớp 10" }]} />
        <DatePicker placeholder="Choose date" />
        <DateRangePicker placeholder="Choose range" />
        <FileUpload label="Upload certs" />
        <Attachment fileName="bang-tot-nghiep.pdf" fileSize={1024000} fileType="pdf" />
      </div>
    );
    expect(screen.getByText("Choose subject")).toBeInTheDocument();
    expect(screen.getByText("Choose grades")).toBeInTheDocument();
    expect(screen.getByText("Choose date")).toBeInTheDocument();
    expect(screen.getByText("Choose range")).toBeInTheDocument();
    expect(screen.getByText("Upload certs")).toBeInTheDocument();
    expect(screen.getByText("bang-tot-nghiep.pdf")).toBeInTheDocument();
  });

  it("renders feedback and overlays (Spinner, Skeleton, Badge, ToastProvider, Dialog, Sheet)", () => {
    render(
      <ToastProvider>
        <div>
          <Spinner label="Loading items..." />
          <Skeleton width={100} height={20} data-testid="test-skeleton" />
          <Badge variant="brand">Verified</Badge>
          <Dialog isOpen={false} onClose={() => {}} title="Test Dialog" />
          <Sheet isOpen={false} onClose={() => {}} title="Test Sheet" />
        </div>
      </ToastProvider>
    );
    expect(screen.getByText("Loading items...")).toBeInTheDocument();
    expect(screen.getByTestId("test-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("renders data display and layouts (Avatar, Image, Card, Accordion, ChipBar, WelcomeBanner, FAB)", () => {
    render(
      <div>
        <AvatarGroup>
          <Avatar fallbackText="Nguyen Van A" />
        </AvatarGroup>
        <Image src="/sample.png" alt="Sample image" />
        <Card>
          <CardTitle>Card Title Test</CardTitle>
        </Card>
        <Accordion items={[{ id: "1", title: "FAQ 1", children: "Answer 1" }]} />
        <ChipBar chips={[{ id: "c1", label: "Chip 1" }]} />
        <WelcomeBanner title="Welcome User" />
        <FAB position="none" icon={<span>+</span>} label="Create" />
      </div>
    );
    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("Card Title Test")).toBeInTheDocument();
    expect(screen.getByText("FAQ 1")).toBeInTheDocument();
    expect(screen.getByText("Chip 1")).toBeInTheDocument();
    expect(screen.getByText("Welcome User")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders schedulers and timelines (Timeline, Calendar, EventCalendar, GanttChart)", () => {
    render(
      <div>
        <Timeline items={[{ id: "t1", title: "Step 1" }]} />
        <Calendar events={[{ id: "e1", date: "2026-10-05", title: "Class A" }]} />
        <EventCalendar events={[]} />
        <GanttChart tasks={[{ id: "g1", name: "Topic 1", startWeek: 1, durationWeeks: 2 }]} />
      </div>
    );
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Topic 1")).toBeInTheDocument();
  });
});
