import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import Course from "./course";
import {
  useLoadUserQuery,
  useUpdateUserMutation,
} from "@/features/api/authApi";
import { toast } from "sonner";

const Profile = () => {
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Key to force avatar re-render

  const { data: userData, isLoading, refetch } = useLoadUserQuery();
  const [updateUser, { isLoading: updateUserIsLoading }] = useUpdateUserMutation();

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
    }
  }, [userData]);

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateUserHandler = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      await updateUser(formData).unwrap();
      toast.success("Profile updated successfully");
      
      // Force refresh of the avatar component
      setAvatarKey(Date.now());
      
      // Clear the preview and form
      setPreviewImage(null);
      setProfilePhoto(null);
      
      // Refetch user data
      await refetch();
    } catch (err) {
      console.error("Update Profile Error:", err);
      toast.error("Failed to update profile.");
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Avatar Column */}
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <Avatar key={avatarKey} className="h-32 w-32 md:h-40 md:w-40 mb-4 border-2 border-gray-200">
              <AvatarImage
                src={userData?.photoUrl || "https://github.com/shadcn.png"}
                alt="Profile photo"
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {userData?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-800">Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="text-gray-700">Profile Photo</Label>
                    <Input
                      id="photo"
                      onChange={onChangeHandler}
                      type="file"
                      accept="image/*"
                      className="bg-gray-50"
                    />
                    {previewImage && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Preview:</p>
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="h-20 w-20 rounded-full object-cover border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={updateUserHandler}
                    disabled={updateUserIsLoading}
                    className="w-full md:w-auto"
                  >
                    {updateUserIsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Column */}
          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="font-medium text-gray-500 mb-1">Full Name</h2>
              <p className="text-gray-800 font-medium">{userData?.name || "Not provided"}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="font-medium text-gray-500 mb-1">Email Address</h2>
              <p className="text-gray-800 font-medium">{userData?.email}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="font-medium text-gray-500 mb-1">Account Type</h2>
              <p className="text-gray-800 font-medium">
                {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "User"}
              </p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">My Courses</h2>
          
          {userData?.enrolledCourses?.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
              <Button variant="outline" onClick={() => window.location.href = '/courses'}>
                Browse Courses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData?.enrolledCourses?.map((course) => (
                <Course course={course} key={course._id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;