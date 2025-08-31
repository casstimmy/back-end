import Layout from "@/components/Layout";
import ProductForm from "@/components/ProductForm";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditProductPage(){
    const [ProductInfo, setProductInfo] = useState(null);
    const router = useRouter();
    const {id} = router.query;

    useEffect(() => {
        if (!id) {
            return;
        }
        axios.get('/api/products?id='+id).then(res => {
            setProductInfo(res.data);
        });
    }, [id]);
    return (
        <Layout>
            <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-xl font-semibold">Advanced Options</h2>
          </div>
          {ProductInfo && (
            <ProductForm {...ProductInfo} />
          )}
        </Layout>
    )
}