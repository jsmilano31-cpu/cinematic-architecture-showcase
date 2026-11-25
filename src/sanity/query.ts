// Project only the editorial fields the presentation uses. Uploaded assets take precedence over demo paths.
const image = `{
 'url':coalesce(upload.asset->url,url),
 'portraitUrl':select(!defined(upload.asset) => portraitUrl),
 'width':coalesce(upload.asset->metadata.dimensions.width,width),
 'height':coalesce(upload.asset->metadata.dimensions.height,height),
 'focalX':upload.hotspot.x*100,'focalY':upload.hotspot.y*100,
 alt,caption,credit,category,roomId
}`;
const media = `{title,'url':coalesce(file.asset->url,url),poster${image},caption,captionsUrl,transcript,azimuth,'furnishedUrl':coalesce(furnishedFile.asset->url,furnishedUrl)}`;
export const showcaseQuery = `{
 'settings':*[_type=='siteSettings' && _id=='siteSettings'][0]{wordmark,logo${image},contactName,email,footer,navigation,socials[]{label,url},seoTitle,seoDescription},
 'project':*[_type=='project' && _id=='project'][0]{
   demo,title,slug,subtitle,typology,location,year,status,area,hero${image},heroMode,heroVideo,sequenceManifest,
   sections[]{id,label,title,intro,visible},'conceptBlocks':concept,'concept':pt::text(concept),
   conceptImages[]${image},exterior[]${image},interiors[]${image},
   floors[]{floorId,title,description,image${image},hotspots[]{roomId,x,y,polygon[]{x,y}}},
   rooms[]{roomId,floorId,title,areaSqm,description,images[]${image}},
   video${media},model${media},materials[]{name,swatch,image${image},description,category},facts[]{label,value,unit},
   finaleImage${image},recap,ctaLabel,ctaLink,seoTitle,seoDescription,ogImage${image}
 }
}`;
