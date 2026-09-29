"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileVideo, Image } from "lucide-react";
import React from "react";

const CreatePost = ({ children }: { children: React.ReactNode }) => {
  const fileInputRef = React.useRef<null | HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!fileInputRef?.current) return null;
    fileInputRef.current.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-full min-w-[348px] min-h-[391px] max-w-[75vw] lg:max-w-[737px] max-h-[75vh] p-0 bg-card text-card-foreground">
        <DialogTitle className="hidden" />
        <DialogHeader className="h-full">
          <div className="h-[43px] border-b border-border grid place-items-center">
            <h4 className="text-foreground text-base font-semibold">
              Create new post
            </h4>
          </div>

          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-y-6">
              <div className="relative">
                <Image className="w-16 h-16 -rotate-6 -translate-x-4 translate-y-10" />
                <FileVideo className="w-16 h-16 rotate-6 translate-x-4 bg-card" />
              </div>

              <h3 className="text-foreground text-xl">
                Drag photos and videos here
              </h3>

              <form>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    hidden
                  />

                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="bg-primary text-primary-foreground py-[7px] px-4 rounded-lg text-sm border-none outline-none hover:opacity-90 transition duration-75"
                  >
                    Select from computer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;
