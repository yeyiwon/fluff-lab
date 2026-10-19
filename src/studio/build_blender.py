"""Run Blender --background --python this_file -- source.json output_dir.
The retained .blend contains editable Hair Curves and a Curve to Mesh node tree.
The GLB is the evaluated triangular strand mesh, not an offline render.
"""
import bpy, json, math, sys, os
from mathutils import Vector, kdtree
args=sys.argv[sys.argv.index('--')+1:]
data=json.load(open(args[0])); out=args[1]; os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def xyz(v): return (v[0],-v[2],v[1])
def material(name,color,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
 return m
coat=material('Warm ivory fibers',(.855,.745,.61),.94)
base=material('Skin beneath groom',(.78,.66,.51),.94)
positions=data['positions']; indices=data['indices']
mesh=bpy.data.meshes.new('Continuous organic body + blended limbs');mesh.from_pydata([xyz(positions[i:i+3]) for i in range(0,len(positions),3)],[],[indices[i:i+3] for i in range(0,len(indices),3)]);mesh.update()
body=bpy.data.objects.new('Body',mesh);bpy.context.collection.objects.link(body);mesh.materials.append(base)
for poly in mesh.polygons:poly.use_smooth=True
mesh.normals_split_custom_set_from_vertices([xyz(data['normals'][i:i+3]) for i in range(0,len(data['normals']),3)])
g=data['guides']; count=len(g['lengths']); steps=9
curves=bpy.data.hair_curves.new('Groom - editable Hair Curves');curves.add_curves([steps]*count)
obj=bpy.data.objects.new('Groom',curves);bpy.context.collection.objects.link(obj);curves.materials.append(coat)
coords=[];radii=[]
for i in range(count):
 root=Vector(g['roots'][i*3:i*3+3]);n=Vector(g['normals'][i*3:i*3+3]);bend=Vector(g['bends'][i*3:i*3+3]);length=g['lengths'][i];phase=g['phases'][i]
 side=n.cross(Vector((1,0,0)) if abs(n.y)>.95 else Vector((0,1,0))).normalized()
 for j in range(steps):
  t=j/(steps-1);v=root+n*length*t*.62+bend*length*t*t+side*math.sin(t*5.2+phase)*length*.20*t
  coords.extend(xyz(v));radii.append(max(.00004,g['widths'][i]*(1-t)**.8))
curves.position_data.foreach_set('vector',coords)
layer=curves.attributes.new('fluff_layer','INT','CURVE');layer.data.foreach_set('value',g['layers'])
obj['layer_legend']='0: short plush undercoat / 1: curved clumps / 2: sparse flyaways'
radius=curves.attributes.new('radius','FLOAT','POINT');radius.data.foreach_set('value',radii)
node=bpy.data.node_groups.new('Game groom - triangular tapered strands','GeometryNodeTree')
node.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry');node.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
a=node.nodes.new('NodeGroupInput');b=node.nodes.new('NodeGroupOutput');circle=node.nodes.new('GeometryNodeCurvePrimitiveCircle');circle.inputs['Resolution'].default_value=3;circle.inputs['Radius'].default_value=1
convert=node.nodes.new('GeometryNodeCurveToMesh');setmat=node.nodes.new('GeometryNodeSetMaterial');setmat.inputs['Material'].default_value=coat
resample=node.nodes.new('GeometryNodeResampleCurve');resample.inputs['Count'].default_value=9;node.links.new(a.outputs['Geometry'],resample.inputs['Curve']);node.links.new(resample.outputs['Curve'],convert.inputs['Curve']);node.links.new(circle.outputs['Curve'],convert.inputs['Profile Curve']);node.links.new(convert.outputs['Mesh'],setmat.inputs['Geometry']);node.links.new(setmat.outputs['Geometry'],b.inputs['Geometry'])
attr=node.nodes.new('GeometryNodeInputNamedAttribute');attr.data_type='FLOAT';attr.inputs['Name'].default_value='radius';node.links.new(attr.outputs['Attribute'],convert.inputs['Scale'])
mod=obj.modifiers.new('Exportable groom mesh','NODES');mod.node_group=node
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'character-source.blend'))
bpy.context.view_layer.objects.active=obj;obj.select_set(True);body.select_set(False)
bpy.ops.object.convert(target='MESH');converted=bpy.context.object
for poly in converted.data.polygons:poly.use_smooth=True
# Optical normals blend the coat envelope with the triangular strand normals.
# This suppresses harsh low-sided highlights without removing real strand geometry.
tree=kdtree.KDTree(count)
for i in range(count):tree.insert(xyz(g['roots'][i*3:i*3+3]),i)
tree.balance();optical=[]
for vertex in converted.data.vertices:
 _,index,_=tree.find(vertex.co)
 normal=Vector(xyz(g['normals'][index*3:index*3+3]))*.85+vertex.normal*.15
 optical.append(normal.normalized())
converted.data.normals_split_custom_set_from_vertices(optical)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'character-b.glb'),export_format='GLB',use_selection=True,export_yup=True)
json.dump({'pipeline':'Blender Hair Curves -> Geometry Nodes Curve to Mesh -> GLB','version':bpy.app.version_string,'guides':count,'curvePoints':count*steps,'meshVertices':len(converted.data.vertices),'meshPolygons':len(converted.data.polygons),'parameters':data['parameters'],'candidate':data['candidate'],'layers':{str(i):g['layers'].count(i) for i in range(3)}},open(os.path.join(out,'blender-metrics.json'),'w'),indent=2)
print('FLUFF_EXPORT_OK')
