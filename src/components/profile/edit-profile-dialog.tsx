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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api"
import { userService } from "@/services/user.service"
import type { UserProfileResponse } from "@/types/user.type"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfileResponse | null
  onSaved: (updated: UserProfileResponse) => void
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState("")
  const [pronouns, setPronouns] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "")
      setPronouns(profile.pronouns || "")
      setBio(profile.bio || "")
      setWebsite(profile.website || "")
      setCategory(profile.category || "")
    }
  }, [profile, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const updated = await userService.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim(),
        website: website.trim(),
        pronouns: pronouns.trim(),
        category: category.trim(),
      })
      onSaved(updated)
      toast.success("Đã cập nhật hồ sơ cá nhân!")
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật hồ sơ thất bại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">Chỉnh sửa trang cá nhân</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Tên hiển thị</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Tên hiển thị của bạn"
              className="h-10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Đại từ nhân xưng</label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                maxLength={30}
                placeholder="VD: anh ấy / cô ấy"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Danh mục</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={60}
                placeholder="VD: Nhiếp ảnh gia, Developer"
                className="h-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Tiểu sử (Bio)</label>
              <span className="text-[10px] text-muted-foreground">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              placeholder="Giới thiệu ngắn gọn về bạn..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Trang web</label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={255}
              placeholder="https://example.com"
              className="h-10 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs px-5"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
