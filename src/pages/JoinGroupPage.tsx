import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useGroupStore } from "../store/groupStore";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const JoinGroupPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { getGroupByInviteCode, joinGroupByInviteCode, loading, error, clearError } = useGroupStore();

  const [inviteStatus, setInviteStatus] = useState<"loading" | "valid" | "expired" | "full" | "invalid" | "alreadyMember">("loading");
  const [groupInfo, setGroupInfo] = useState<{ id: string; name: string; memberCount: number; maxMembers: number } | null>(null);

  useEffect(() => {
    if (!inviteCode) {
      setInviteStatus("invalid");
      return;
    }

    const checkInvite = async () => {
      try {
        setInviteStatus("loading");
        const data = await getGroupByInviteCode(inviteCode);
        
        if (data.status === "valid") {
          setGroupInfo(data.group);
          setInviteStatus("valid");
        } else if (data.status === "expired") {
          setInviteStatus("expired");
        } else if (data.status === "full") {
          setInviteStatus("full");
        } else {
          setInviteStatus("invalid");
        }
      } catch (err) {
        setInviteStatus("invalid");
      }
    };

    checkInvite();
  }, [inviteCode, getGroupByInviteCode]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
      navigate(redirectUrl);
      return;
    }

    if (!inviteCode) return;

    try {
      const data = await joinGroupByInviteCode(inviteCode);
      if (data.alreadyMember) {
        alert("Bạn đã là thành viên của nhóm này.");
        navigate(`/groups/${data.groupId}`);
      } else if (data.success) {
        alert("Đã tham gia nhóm!");
        navigate(`/groups/${data.groupId}`);
      }
    } catch (err: any) {
      alert(err.message || "Không thể tham gia nhóm.");
    }
  };

  if (inviteStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-on-surface-variant font-medium">Đang kiểm tra link mời...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (inviteStatus) {
      case "expired":
        return (
          <div className="text-center">
            <span className="material-symbols-outlined text-error text-6xl mb-4">timer_off</span>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Link mời đã hết hạn.</h1>
            <p className="text-on-surface-variant mb-6">Vui lòng liên hệ admin nhóm để nhận link mới.</p>
            <Button variant="secondary" onClick={() => navigate("/")}>Về trang chủ</Button>
          </div>
        );
      case "full":
        return (
          <div className="text-center">
            <span className="material-symbols-outlined text-warning text-6xl mb-4">group_off</span>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Nhóm đã đầy.</h1>
            <p className="text-on-surface-variant mb-6">Nhóm này đã đạt giới hạn 20 thành viên.</p>
            <Button variant="secondary" onClick={() => navigate("/")}>Về trang chủ</Button>
          </div>
        );
      case "invalid":
        return (
          <div className="text-center">
            <span className="material-symbols-outlined text-error text-6xl mb-4">link_off</span>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Link mời không hợp lệ.</h1>
            <p className="text-on-surface-variant mb-6">Có vẻ link này không tồn tại hoặc đã bị xóa.</p>
            <Button variant="secondary" onClick={() => navigate("/")}>Về trang chủ</Button>
          </div>
        );
      case "valid":
        return (
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">groups</span>
            </div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Lời mời tham gia nhóm</p>
            <h1 className="text-3xl font-extrabold text-on-surface mb-2">{groupInfo?.name}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant text-sm font-medium mb-8">
              <span className="material-symbols-outlined text-sm">person</span>
              {groupInfo?.memberCount}/{groupInfo?.maxMembers} thành viên
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleJoin} 
                isLoading={loading}
                className="w-full sm:w-auto px-10"
              >
                {isAuthenticated ? "Tham gia nhóm" : "Đăng nhập để tham gia"}
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-10"
              >
                Hủy
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 sm:p-12 shadow-xl animate-scale-in">
        {renderContent()}
      </Card>
    </div>
  );
};

export default JoinGroupPage;
