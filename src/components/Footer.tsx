import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-700 text-warm-200/70">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="font-serif text-2xl font-bold text-warm-50">
              心镜
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              用通俗易懂的语言，帮助你理解心理学知识，
              <br />
              正视自己的情绪与处境，重拾从头再来的勇气。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-serif text-warm-50 font-semibold mb-4">快速导航</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="hover:text-warm-50 transition-colors">
                首页
              </Link>
              <Link to="/knowledge" className="hover:text-warm-50 transition-colors">
                知识库
              </Link>
              <Link to="/search" className="hover:text-warm-50 transition-colors">
                情绪罗盘
              </Link>
              <Link to="/diary" className="hover:text-warm-50 transition-colors">
                心灵日记
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="font-serif text-warm-50 font-semibold mb-4">免责声明</h4>
            <p className="text-sm leading-relaxed">
              本网站内容仅供心理知识科普，不能替代专业心理咨询或治疗。
              如果你正在经历严重的心理困扰，请及时寻求专业帮助。
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-warm-200/10 text-center text-sm">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart size={14} className="text-warm-500" /> 心镜 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}