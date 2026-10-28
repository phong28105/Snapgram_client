"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, HelpCircle, ImagePlus, Loader2, Send, X } from "lucide-react"
import { toast } from "sonner"
import { mediaService } from "@/services/media.service"
import { supportService } from "@/services/support.service"
import type {
  CreateSupportTicketPayload,
  SupportTicket,
  SupportTicketCategory,
} from "@/types/support.type"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORIES: { label: string; value: SupportTicketCategory }[] = [
  { label: "Lỗi ứng dụng / Kỹ thuật", value: "TECHNICAL_ISSUE" },
  { label: "Tài khoản & Đăng nhập", value: "ACCOUNT_ISSUE" },
  { label: "Thanh toán & Tích xanh", value: "PAYMENT_ISSUE" },
  { label: "Góp ý cải tiến tính năng", value: "FEATURE_FEEDBACK" },
  { label: "Vấn đề khác", value: "OTHER" },
]

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [activeTab, setActiveTab] = useState("create")
  const [category, setCategory] = useState<SupportTicketCategory>("TECHNICAL_ISSUE")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // My tickets state
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

  const loadMyTickets = async () => {
    setIsLoadingTickets(true)
    try {
      const data = await supportService.getMyTickets(0, 20)
      setMyTickets(data.content || [])
    } catch {
      // Ignored
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
    if (open && activeTab === "history") {
      void loadMyTickets()
    }
  }, [open, activeTab])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ tải lên tệp hình ảnh")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đính kèm tối đa 5MB")
      return
    }

    setIsUploading(true)
    try {
      const media = await mediaService.upload(file)
      setAttachments((prev) => [...prev, media.url])
      toast.success("Đã tải ảnh lên")
    } catch {
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error("Vui lòng điền tiêu đề và mô tả sự cố")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateSupportTicketPayload = {
        category,
        subject: subject.trim(),
        description: description.trim(),
        attachments,
      }
      await supportService.createTicket(payload)
      toast.success("Đã gửi báo cáo sự cố thành công! Chúng tôi sẽ phản hồi sớm nhất.")
      setSubject("")
      setDescription("")
      setAttachments([])
      setActiveTab("history")
      void loadMyTickets()
    } catch {
      toast.error("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Trung tâm Trợ giúp & Báo cáo Sự cố
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="create">Gửi yêu cầu hỗ trợ</TabsTrigger>
              <TabsTrigger value="history">Yêu cầu của bạn ({myTickets.length})</TabsTrigger>
            </TabsList>

            {/* TAB 1: GỬI YÊU CẦU */}
            <TabsContent value="create">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Danh mục sự cố</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <Button
                        key={cat.value}
                        type="button"
                        variant={category === cat.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategory(cat.value)}
                        className="text-xs h-9 justify-start font-normal truncate"
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tiêu đề sự cố</label>
                  <Input
                    placeholder="Tóm tắt ngắn gọn vấn đề bạn gặp phải..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mô tả chi tiết</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Mô tả cụ thể các bước dẫn đến lỗi hoặc yêu cầu trợ giúp..."
                    rows={4}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    maxLength={2000}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Ảnh chụp màn hình (tùy chọn)</span>
                    <span className="text-xs text-muted-foreground">{attachments.length}/3 ảnh</span>
                  </label>

                  <div className="flex flex-wrap gap-2 items-center">
                    {attachments.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                        <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {attachments.length < 3 ? (
                      <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition">
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1">Thêm ảnh</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading || isSubmitting}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isSubmitting || isUploading} className="gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Gửi yêu cầu</span>
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: LỊCH SỬ YÊU CẦU */}
            <TabsContent value="history" className="space-y-3">
              {isLoadingTickets ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : myTickets.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-sm">Bạn chưa gửi yêu cầu hỗ trợ nào</p>
                </div>
              ) : (
                myTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          ticket.status === "OPEN"
                            ? "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20 text-xs"
                            : ticket.status === "IN_PROGRESS"
                              ? "border-sky-300 text-sky-600 bg-sky-50 dark:bg-sky-950/20 text-xs"
                              : ticket.status === "RESOLVED"
                                ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-xs"
                                : "text-xs"
                        }
                      >
                        {ticket.status === "OPEN"
                          ? "Chờ xử lý"
                          : ticket.status === "IN_PROGRESS"
                            ? "Đang xử lý"
                            : ticket.status === "RESOLVED"
                              ? "Đã giải quyết"
                              : "Đã đóng"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>

                    {/* Admin Response Box */}
                    {ticket.adminReply ? (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Phản hồi từ Đội ngũ Hỗ trợ Snapgram:</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.adminReply}</p>
                      </div>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">
                        Yêu cầu đang chờ nhân viên kiểm tra và phản hồi.
                      </p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
