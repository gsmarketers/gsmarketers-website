@@ .. @@
           {featuredImage && (
             <div className="relative h-[400px] mb-8 rounded-2xl overflow-hidden">
               <img
                 src={featuredImage}
-                alt={post.title.rendered}
+                alt={post.title}
                 className="absolute inset-0 w-full h-full object-cover"
               />
             </div>
           )}